var express = require('express'); // Express routing middleware
var router = express.Router();
const axios = require('axios');   // Library for http requests
const multer = require('multer'); // Library for local file management
const scp = require('scp')        // Library for connecting and exchanging files with an AWS instance via scp
const { default: Client } = require('node-scp');
const fs = require('fs');         // Library for file system functionality
const gjv = require("geojson-validation"); // GeoJSON Validator

// Variables for saving input data between API calls
let fileNames = new Array();
let serverFileNames = new Array();
let ui_Body;
let fileName;

// Option stack for multer library
var storage = multer.diskStorage({
  destination: function (request, file, callback) {
      callback(null, './tmp');
  },
  filename: function (request, file, callback) {
      fileName=file.originalname;
      callback(null, file.originalname);
  }
});

const uploadDest = multer({storage:storage})

/**
 * API route to get the file selected by the user and load it into the Node.js environment for further use.
 * After loading is finished, it redirects to the download/ results page.
 */
router.post('/upload', uploadDest.single('modelFile'), function(req, res) {
  ui_Body=req.body; 
  fileNames.push(fileName); // Saving file name for later use
  res.redirect("/download.html")
})

/**
 * API call to send all necessary parameters and files via scp and axios to the Plumber API and AWS instance.
 * Validates user input. If validation fail, redirects to the index page.
 * Fetch the result URLs and download the files.
 */
router.get('/results',function(req, res) {
  let radioButton = ui_Body.modelInput;
  let mime = fileName.split(".")[1];
  try{
    // Validate GeoJSON of area of interest
    if(gjv.valid(JSON.parse(ui_Body.geoJSONInput))===false){  
      res.json({success:false, message:"Your area of interest GeoJSON Code was invalid!"})
    }
    // Check if end day was not before start day
    else if(ui_Body.startDay>ui_Body.endDay){     
      res.json({success:false, message:"The end day must be more recent then the start day!"})
    }
    // Check if no date is in the future
    else if(ui_Body.startDay<Date.now() || ui_Body.endDay<Date.now()){
      res.json({success:false, message:"Chosen dates cannot be in the future!"})
    }
    // Else case if validation was successfull
    else{
      let coordinates = ui_Body.geoJSONInput;
      //let aoiFileName = aoi
      fs.writeFileSync("./tmp/aoi.geojson", coordinates)
      // Check if mode for a trained model was selected
      if(radioButton==="model"){
        // Check for correct MIME types
        if(mime==="rds" || mime==="RDS" || mime==="rdata" || mime==="RDATA"){
          // upload moddel file to AWS
          // upload("./tmp/"+fileName, "model", "RDS", "./tmp/aoi.geojson");
          // axios.post('http://127.0.0.1:6516/aoamodel', {
          //   "cloud_cover": 60,
          //   "start_day": "2021-04-01",
          //   "end_day": "2021-04-30",
          //   "resolution": 100,
          //   "path_model": "/tmp/model.RDS",
          //   "aoi": "/tmp/aoi.geojson"
          // })
          // .then(response => {
          //   console.log(response.data)
          // })
          // .catch(error => {
          //   console.log(error);
          // })
        }else{
          // if not correct, send json with error message
          res.json({success:false, message:"File is not an R model file in .rds or .rdata format!"})
        }
      // Check if mode for train data was selected
      }else if(radioButton==="train"){
        // Check for correct MIME types
        if(mime==="geojson" || mime==="GEOJSON" || mime==="gpkg" || mime==="GPKG"){
          // Upload train data to AWS
          upload("./tmp/"+fileName, "train", mime, "./tmp/aoi.geojson");
        }else{
          // if not correct, send json with error message
          res.json({success:false, message:"File is not an spatial data file in .geojson or .gpkg format!"})
        }
      // Catch errors where no mode is selected
      }else{
        res.json({success:false, message:"No input mode was selected!"})
      }
    }
  }catch(e){
    // Catch any error with requests, API calls and file interactions
    res.json({success:false, message:"Error: "+e})
  }
})

/**
 * 
 */
async function download(){
  try{
    const client =  await Client({
    host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
    port: 22, //port used for scp 
    username: 'ubuntu', //username to authenticate
    privateKey: fs.readFileSync('keys/key.pem'), // local relative path to your pem file
  }).then(client => {
    client.downloadFile('/tmpextern/aoa.tif', 'public/images/test.tif')
      .then(response => {
        client.close() // remember to close connection after you finish
      })
      .catch(error => {console.log(error)})
  }).catch(e => console.log(e))
  }catch(e){
    console.log(e)
  }
}

/**
 * Uploads a given local file to an AWS instance via scp. Autogenerate unique file names with a set prefix and a suffix acoording to the date.
 * @param {String} localPath Path to the local file to be uploaded to the AWS
 * @param {String} file Short prefix (model, train) for later name creation
 * @param {String} type MIME type of the file which should be uploaded
 */
async function upload(localPath, file, type, jsonPath){
  try {
    // Connection to AWS
    const client = await Client({
      host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
      port: 22, //port used for scp 
      username: 'ubuntu', //username to authenticate
      privateKey: fs.readFileSync('keys/key.pem'), // local relative path to your pem file
    })
    // Create uniquie file name
    // let uniqueStamp = createFileNames(Date.now());
    // let newFileName = file+"_"+uniqueStamp+"."+type;
    // let newJSONName = 
    // Save file name for the Plumber code
    // serverFileNames.push(newFileName1);
    // upload file
    await client.uploadFile(localPath, "/tmpextern/"+file+"."+type); // , '/tmp/'+newFileName
    await client.uploadFile(jsonPath, '/tmpextern/aoi.geojson');
    client.close()
    // Delete copied file locally to free memory
    fs.unlink(localPath,(err)=>{
      console.log(err)
    })
    fs.unlink(jsonPath,(err)=>{
      console.log(err)
    })
  } catch (e) {
      console.log(e)
  }
}

/**
 * Takes a unix timestemp to convert it to String of numbers to ensure unique file names
 * @param {*} unixTime unix timestemp
 * @returns String of Numbers encoding the day and time with Year, Month, Day, Hour, Minutes and Seconds
 */
 function createFileNames(unixTime){
  let dateObject = new Date(unixTime);
  let converted=dateObject.toLocaleTimeString([],{year:'2-digit', month:'2-digit', day:'2-digit', hour: '2-digit', minute:'2-digit',second:"2-digit"});
  for (i=0; i<2; i++){
      converted=converted.replace('.','');
  }
  converted=converted.replace(' ','');
  converted=converted.replace(',','_');
  for (i=0; i<2; i++){
      converted=converted.replace(':','');
  }
  console.log(converted)
  return converted;
}

module.exports = router;