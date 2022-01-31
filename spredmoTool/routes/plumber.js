var express = require('express');
var router = express.Router();
const axios = require('axios');
const multer = require('multer');
const scp = require('scp')
const fs = require('fs');
const { default: Client } = require('node-scp');
const { send } = require('process');
const gjv = require("geojson-validation");

let fileNames = new Array();
let serverFileNames = new Array();
let ui_Body;
let fileName;

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
router.post('/upload', uploadDest.single('modelFile'), function(req, res) {
  ui_Body=req.body; 
  fileNames.push(fileName);
  res.redirect("/download.html")
})

router.get('/results',function(req, res) {
  let radioButton = ui_Body.modelInput;
  let mime = fileName.split(".")[1];
  try{
    if(gjv.valid(JSON.parse(ui_Body.geoJSONInput))===false){
      res.json({success:false, message:"Your area of interest GeoJSON Code was invalid!"})
    }else if(ui_Body.startDay>ui_Body.endDay){
      res.json({success:false, message:"The end day must be more recent then the start day!"})
    }else if(ui_Body.startDay<Date.now() || ui_Body.endDay<Date.now()){
      res.json({success:false, message:"Chosen dates cannot be in the future!"})
    }else{
      if(radioButton==="model"){
        if(mime==="rds" || mime==="RDS" || mime==="rdata" || mime==="RDATA"){
          upload("./tmp/"+fileName, "model", mime);
        }else{
          res.json({success:false, message:"File is not an R model file in .rds or .rdata format!"})
        }
      }else if(radioButton==="train"){
        if(mime==="geojson" || mime==="GEOJSON" || mime==="gpkg" || mime==="GPKG"){
          upload("./tmp/"+fileName, "train", mime);
        }else{
          res.json({success:false, message:"File is not an spatial data file in .geojson or .gpkg format!"})
        }
      }else{
        res.json({success:false, message:"No input mode was selected!"})
      }
    }
    
  }catch(e){
    res.json({success:false, message:"Error: "+e})
  }
})
  
router.get('/wrongInput',function(req, res) {
  res.redirect("/index.html")
})

async function download(){
  try{
    const client =  await Client({
    host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
    port: 22, //port used for scp 
    username: 'ubuntu', //username to authenticate
    privateKey: fs.readFileSync('G:/GitHubRepositories/Spredmo_Geosoft2/spredmoTool/public/images/geosoft22021.pem'),
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

async function upload(localPath, file, type){
  try {
    const client = await Client({
      host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
      port: 22, //port used for scp 
      username: 'ubuntu', //username to authenticate
      privateKey: fs.readFileSync('G:/GitHubRepositories/Spredmo_Geosoft2/spredmoTool/public/images/geosoft22021.pem'),
    })
    let uniqueStamp = createFileNames(Date.now());
    let newFileName = file+"_"+uniqueStamp+"."+type;
    serverFileNames.push(newFileName);
    await client.uploadFile(localPath, '/tmpextern/'+newFileName);
    // you can perform upload multiple times
    client.close() // remember to close connection after you finish

    fs.unlink(localPath,(err)=>{
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