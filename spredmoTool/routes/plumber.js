var express = require('express');
var router = express.Router();
const axios = require('axios');
//var dataAPI = require('./../public/javascripts/download_visualize')

router.post('/',function(req, res) {
  
    axios.post('http://127.0.0.1:6516/aoamodel', {
        "cloud_cover": 60,
        "start_day": "2021-04-01",
        "end_day": "2021-04-30",
        "resolution": 100,
        "path_model": "/tmpextern/model2323411.RDS",
        "aoi": "/tmpextern/aoi1232523.geojson"
    })
    .then(response => {
      console.log(response.data)
    })
    .catch(error => {
      console.log(error);
    })
  

  /*
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
  /*
  axios.get('http://127.0.0.1:3010/results')
    .then(response => {
      console.log(response.data)
      res.send(response.data)
    })
    .catch(error => {
      console.log(error);
    })
    */
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