var express = require('express');
var router = express.Router();
const axios = require('axios');
const scp = require('scp')
const fs = require('fs');
const { default: Client } = require('node-scp');

router.post('/',function(req, res) {
  if (req.body.modus=="model"){
    axios.get('http://127.0.0.1:4134/echo?msg=sdf')
    .then(response => {
      msg=response.data.msg[0]
      console.log(msg)
    })
    .catch(error => {
      console.log(error);
    })
  }
  else if(req.body.modus=="tdata"){
    axios.get('http://127.0.0.1:4134/echo?msg=Hello%2Cthis%20is%20the%20mean')
    .then(response => {
      msg=response.data.msg[0]
      console.log(msg)
    })
    .catch(error => {
      console.log(error);
    })
  }
  async function upload(){
    try {
      const client = await Client({
        host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
    port: 22, //port used for scp 
    username: 'ubuntu', //username to authenticate
    privateKey: fs.readFileSync('G:/GitHubRepositories/Spredmo_Geosoft2/spredmoTool/public/images/geosoft22021.pem'),
    // passphrase: 'your key passphrase', 
      })
      await client.uploadFile('public/images/logo.jpeg', '/tmp/logoTest.jpeg')
      // you can perform upload multiple times
      client.close() // remember to close connection after you finish
    } catch (e) {
      console.log(e)
    }
  }
  upload();
  
  res.redirect("/download.html")
}
)

router.get('/results',function(req, res) {
  axios.get('http://127.0.0.1:4134/echo?msg=Hello%2Cthis%20is%20the%20mean')
    .then(response => {
      msg=response.data.msg[0]
      res.send(msg)
    })
    .catch(error => {
      console.log(error);
    })
  }
)
router.get('/geotiff', async function(req, res) {
  const client =  await Client({
    host: 'ec2-35-86-197-46.us-west-2.compute.amazonaws.com', //remote host ip 
    port: 22, //port used for scp 
    username: 'ubuntu', //username to authenticate
    privateKey: fs.readFileSync('G:/GitHubRepositories/Spredmo_Geosoft2/spredmoTool/public/images/geosoft22021.pem'),
    // passphrase: 'your key passphrase', 
  }).then(client => {
    client.downloadFile('/tmp/aoa.tif', 'public/images/test.tif')
      .then(response => {
        client.close() // remember to close connection after you finish
      })
      .catch(error => {console.log(error)})
  }).catch(e => console.log(e))
})

module.exports = router;