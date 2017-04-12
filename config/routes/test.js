'use strict';

const router = require('express').Router(),
  mw = require('../middleware.js'),
  mail = require('../mail.js');

router.route('/mail').get(function(req,res,next){
	mail.send({
	  to: `"Keith Irwin" <hypergeek14@gmail.com>`,
	  from: mail.from,
	  subject: 'Test email',
	  text: mail.text("Looks like everything's working! "),
	  html: mail.html("<p>Looks like everything's working! </p>")
	}).then(function(){
		console.log("Test email should have sent...");
		res.sendStatus(200);
	}).catch(function(err){
	  mw.throwErr(err,req);
	  next();
	});
});

router.route('/password').get(function(req,res){
	res.render('password');
});

module.exports = router;