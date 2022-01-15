var express = require('express');
var router = express.Router();
const axios = require('axios');
var dataAPI = require('./../public/javascripts/download_visualize')

router.get('/',async function(req, res) {
  let response = await dataAPI.getData();
  res.redirect("/download.html")
}
)
module.exports = router;