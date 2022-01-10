/*function plumberSend(){
    $.ajax({
        url:"http://127.0.0.1:8561/echo?msg=hello,callback=?",
        type:"GET",
        success: function(result){
            alert(result.msg)},
        error: function(error){
            alert(JSON.stringify(error))
        }
    })
    const xhr = new XMLHttpRequest();
    const url = 'http://127.0.0.1:8561/echo?msg=hello';

    xhr.open('GET', url);
    xhr.onreadystatechange = someHandler;
    xhr.send();
    $.getJSON("http://127.0.0.1:5598/echo?msg=hello", function(data){
        console.log(data)
    });
}*/
var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/',async function(req, res, next) {
  let response = await axios.get('http://127.0.0.1:5598/echo?msg=hello')
    .then(response => {
      console.log(response.data.msg);
      res.send(response.data.msg[0])
    })
    .catch(error => {
      console.log(error);
    });
  
})
module.exports = router;