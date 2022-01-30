var express = require('express');
var router = express.Router();
const axios = require('axios');
const multer = require('multer');
const scp = require('scp')
const fs = require('fs');
const { default: Client } = require('node-scp');
const { send } = require('process');

var fileName;
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
  let radioButton = req.body.modelInput;
  if(radioButton==="model"){
    upload("./tmp/"+fileName)
  }else if(radioButton==="train"){
    console.log("train")
  }else{
    console.log("No mode selected")
  }
  try{
  }catch(e){
    console.log(e)
  }
  
  res.redirect("/download.html")
})

router.post('/results',function(req, res) {
})
  
async function download(){
  try{
    const client =  await Client({
    host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
    port: 22, //port used for scp 
    username: 'ubuntu', //username to authenticate
    privateKey: fs.readFileSync('G:/GitHubRepositories/Spredmo_Geosoft2/spredmoTool/public/images/geosoft22021.pem'),
  }).then(client => {
    client.downloadFile('/tmp/aoa.tif', 'public/images/test.tif')
      .then(response => {
        client.close() // remember to close connection after you finish
      })
      .catch(error => {console.log(error)})
  }).catch(e => console.log(e))
  }catch(e){
    console.log(e)
  }
}

async function upload(localPath, newFileName){
  try {
    const client = await Client({
      host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
      port: 22, //port used for scp 
      username: 'ubuntu', //username to authenticate
      privateKey: fs.readFileSync('G:/GitHubRepositories/Spredmo_Geosoft2/spredmoTool/public/images/geosoft22021.pem'),
    })
    await client.uploadFile(localPath, '/tmp/'+newFileName)
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