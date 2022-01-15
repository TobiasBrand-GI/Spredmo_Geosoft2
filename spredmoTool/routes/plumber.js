var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/',function(req, res, next) {
  axios.get('http://127.0.0.1:5598/echo?msg=hello')
    .then(response => {
      console.log(response.data.msg);
      res.send(response.data.msg[0])
    })
    .catch(error => {
      console.log(error);
    });
})
module.exports = router;