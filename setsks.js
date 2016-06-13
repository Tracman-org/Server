var speakeasy = require('speakeasy');
var User = require('./config/models/user.js');

User.update(
  {isPro:false}, 
  {sk32: speakeasy.generateSecret({length: 20}).base32},
  { multi: true },
  function(err, num){
    if (err) {console.log(err);}
    else {console.log(num,'updated');}
  }
);