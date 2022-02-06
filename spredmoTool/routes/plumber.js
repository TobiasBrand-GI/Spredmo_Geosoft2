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
  res.redirect("/download.html?mode=plumber")
})

/**
 * API call to send all necessary parameters and files via scp and axios to the Plumber API and AWS instance.
 * Validates user input. If validation fail, redirects to the index page.
 * Fetch the result URLs and download the files.
 */
router.get('/results',async function(req, res) {
  let radioButton = ui_Body.modelInput;
  let mime = fileName.split(".")[1];

  // variables for API strings
  var start= (ui_Body.startDay).toString();
  var end = (ui_Body.endDay).toString();
  var clouds = ((ui_Body.myRange)*10);
  var resolution = ui_Body.resolution;

  console.log("PlUMBER CALLED")

  try{
    // Validate GeoJSON of area of interest
    let aoiJSON = JSON.parse(ui_Body.geoJSONInput);
    if(gjv.valid(aoiJSON)===false){  
      res.json({success:false, message:"Your area of interest GeoJSON Code was invalid!"})
    }
    // Else case if validation was successfull
    else{
      let coordinates = ui_Body.geoJSONInput;
      //let aoiFileName = aoi
      fs.writeFileSync("./tmp/aoi.geojson", coordinates)
      // Check if mode for a trained model was selected
      if(radioButton==="model"){
        // Check for correct MIME types
        if(mime==="rds" || mime==="RDS"){
          // upload moddel file to AWS
          await upload("./tmp/"+fileName, "model", "rds", "./tmp/aoi.geojson");
          axios({
            method:'post',
            url:'http://ec2-35-86-197-46.us-west-2.compute.amazonaws.com:8780/aoamodel',
            headers:{'Content-Type': 'text/plain'},
            data:'[{"cloud_cover": '+clouds+',"start_day": "'+start+'","end_day": "'+end+'","resolution": '+resolution+',"path_model": "tmp/model.rds","path_aoi": "tmp/aoi.geojson"}]'
          })
          .then(async function(response){
            // Download all necessary files from the server
            await download("/"+response.data[0][0], "public/images/final_model.rds")
            await download("/"+response.data[1][0], "public/images/lulc-prediction.tif")
            await download("/"+response.data[2][0], "public/images/di_of_aoa.tif")
            await download("/"+response.data[3][0], "public/images/aoa.tif")
            // Download json file. Due to async problems, this needs to be called seperatly
            if(response.data[5]===1){
              fs.existsSync("public/images/sample_points.json")
              // delete possible old json files. Avoid cache problems
              fs.unlink("public/images/sample_points.json",(err)=>{
                console.log(err)
              })
              await download("/"+response.data[4][0], "public/images/sample_points.json")
            }
            res.json({success:true, message:"Calculation successfull!", aoi:aoiJSON, classes:response.data[6], status:response.data[5]})
          })
          .catch(error => {
            console.log(error);
            res.json({success:false, message:"Error: "+e})
          })
        }else{
          // if not correct, send json with error message
          res.json({success:false, message:"File is not an R model file in .rds format!"})
        }
      // Check if mode for train data was selected
      }else if(radioButton==="train"){
        // Check for correct MIME types
        if(mime==="geojson" || mime==="GEOJSON" || mime==="gpkg" || mime==="GPKG"){
          // Upload train data to AWS
          await upload("./tmp/"+fileName, "tdata", mime, "./tmp/aoi.geojson");
          axios({
            method:'post',
            url:'http://ec2-35-86-197-46.us-west-2.compute.amazonaws.com:8780/aoatdata',
            headers:{'Content-Type': 'text/plain'},
            data:'[{"cloud_cover": 50,"start_day": "2021-04-01","end_day": "2021-04-30","resolution": 100,"path_tdata": "tmp/tdata.geojson","path_aoi": "tmp/aoi.geojson"}]'
          })
          .then(async function(response){
            await download("/"+response.data[0][0], "public/images/final_model.rds")
            await download("/"+response.data[1][0], "public/images/lulc-prediction.tif")
            await download("/"+response.data[2][0], "public/images/di_of_aoa.tif")
            await download("/"+response.data[3][0], "public/images/aoa.tif")
            // Download json file. Due to async problems, this needs to be called seperatly
            if(response.data[5]===1){
              fs.existsSync("public/images/sample_points.json")
              // delete possible old json files. Avoid cache problems
              fs.unlink("public/images/sample_points.json",(err)=>{
                console.log(err)
              })
              await download("/"+response.data[4][0], "public/images/sample_points.json")
            }
            res.json({success:true, message:"Calculation successfull!", aoi:aoiJSON, classes:response.data[6], status:response.data[5]})
          })
          .catch(error => {
            console.log(error);
            res.json({success:false, message:"Error: "+e})
          })
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
 * API route to clear the servers files to avoid memory overflow
 */
 router.get('/clearServer', function(req, res) {
  // Call API specified via plumber
  axios({
    method:'get',
    url:'http://ec2-35-86-197-46.us-west-2.compute.amazonaws.com:8780/refresh',
  })
  .then(function(response){
    // Catch any possible Errors
    if(response.status===200){
      res.json({success:true,message:"Server files cleared"})
    }else{
      res.json({success:false,message:"An Error occured"})
    }
  })
})

/**
 * Route to read and return the random sample points from a json file
 */
router.get('/loadSamples', function(req, res) {
  // read file from a given path
  fs.readFile('./public/images/sample_points.json','utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }
    // return sample points
    res.json({success:true, message:"Calculation successfull!", samples:jsonString})
  })
})

/**
 * Route to load demodata into the work folder
 */
 router.get('/loadDemo', function(req, res) {
  // copy all necessary data into correct folder
  fs.copyFile('./demodata/sample_points.json', './public/images/sample_points.json', (err) => {
    if (err) throw err;
  });
  fs.copyFile('./demodata/aoa.tif', './public/images/aoa.tif', (err) => {
    if (err) throw err;
  });
  fs.copyFile('./demodata/di_of_aoa.tif', './public/images/di_of_aoa.tif', (err) => {
    if (err) throw err;
  });
  fs.copyFile('./demodata/final_model.rds', './public/images/final_model.rds', (err) => {
    if (err) throw err;
  });
  fs.copyFile('./demodata/lulc-prediction.tif', './public/images/lulc-prediction.tif', (err) => {
    if (err) throw err;
  });
    // return sample points
    res.json({success:true, message:"Copy successfull!"})
})

/**
 * Downloads a given file from an ec2-instance into a local repository
 * @param {String} serverFile Path on the server of the file t download
 * @param {String} localPath Path to local repository + new file name plus type
 */
async function download(serverFile, localPath){
  try{
    //connecting to AWS
    const client =  await Client({
    host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
    port: 22, //port used for scp 
    username: 'ubuntu', //username to authenticate
    privateKey: fs.readFileSync('keys/key.pem'), // local relative path to your pem file
  }).then(client => {
    // start donwload via scp client
    client.downloadFile(serverFile, localPath)
      .then(response => {
        client.close() 
      })
      .catch(error => {console.log(error)})
  }).catch(e => console.log(e))
  }catch(e){
    console.log(e)
  }
}

/**
 * Uploads a given local file to an ec2-instance via scp. Autogenerate unique file names with a set prefix and a suffix acoording to the date.
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
    // start upload via scp client
    await client.uploadFile(localPath, "/tmpextern/"+file+"."+type);
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

module.exports = router;