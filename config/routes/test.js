'use strict';

const router = require('express').Router(),
  mw = require('../middleware.js'),
  mail = require('../mail.js');

router

	.get('/mail', (req,res,next)=>{
		mail.send({
		  to: `"Keith Irwin" <hypergeek14@gmail.com>`,
		  from: mail.from,
		  subject: 'Test email',
		  text: mail.text("Looks like everything's working! "),
		  html: mail.html("<p>Looks like everything's working! </p>")
		})
		.then(()=>{
			console.log("Test email should have sent...");
			res.sendStatus(200);
		})
		.catch((err)=>{
		  mw.throwErr(err,req);
		  res.sendStatus(500);
		});
	})
	
	.get('/password', (req,res)=>{
		res.render('password');
	})
	.post('/password', (req,res)=>{
		//TODO: Server-side checks
		res.sendStatus(200);
	});
	
module.exports = router;