var express = require('express');
var router = express.Router();
const axios = require('axios');
//var dataAPI = require('./../public/javascripts/download_visualize')

router.get('/',async function(req, res) {
  res.redirect("/download.html")
}
)

router.get('/results',function(req, res) {
  axios.get('http://127.0.0.1:5148/echo?msg=Hello%2Cthis%20is%20the%20mean')
    .then(response => {
      msg=response.data.msg[0]
      //console.log(msg)
      res.send(msg)
    })
    .catch(error => {
      console.log(error);
    })
}
)
module.exports = router;