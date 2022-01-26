var express = require('express');
var router = express.Router();
const axios = require('axios');
//var dataAPI = require('./../public/javascripts/download_visualize')

router.post('/',function(req, res) {
  /*
  if (req.body.modus=="model"){
    axios.get('http://127.0.0.1:4280/echo?msg=sdf')
    .then(response => {
      msg=response.data.msg[0]
      console.log(msg)
    })
    .catch(error => {
      console.log(error);
    })
  }
  else if(req.body.modus=="tdata"){
    axios.get('http://127.0.0.1:4280/echo?msg=Hello%2Cthis%20is%20the%20mean')
    .then(response => {
      msg=response.data.msg[0]
      console.log(msg)
    })
    .catch(error => {
      console.log(error);
    })
  }
  */
  res.redirect("/download.html")
}
)


router.get('/results',function(req, res) {
  axios.get('http://127.0.0.1:8214/results')
    .then(response => {
      console.log(response.data)
      res.send(response.data)
    })
    .catch(error => {
      console.log(error);
    })
}
)

/*router.get('/download',function(req, res) {
  axios({
    url: 'http://localhost:3000/public/images/di_of_aoa.tif',
    method: 'GET',
    responseType: 'blob', // important
  }).then((response) => {
    res.send(response)
  })
}
)*/
module.exports = router;