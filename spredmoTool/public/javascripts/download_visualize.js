const axios = require('axios');
/**
 * Returns calculated Data from R API
 */
async function getData(){
    axios.get('http://127.0.0.1:4925/echo?msg=Hello%2Cthis%20is%20the%20mean')
    .then(response => {
      msg=response.data.msg[0]
      console.log(msg)
      return msg
    })
    .catch(error => {
      console.log(error);
    })
}
module.exports = {
    getData
};
