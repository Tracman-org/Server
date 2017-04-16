'use strict';

const router = require('express').Router(),
	mellt = require('mellt'),
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
	.post('/password', (req,res,next)=>{
		let daysToCrack = mellt.CheckPassword(req.body.password);
		if (daysToCrack<10) {
			let err = new Error(`That password could be cracked in ${daysToCrack} days!  Come up with a more complex password that would take at least 10 days to crack. `);
			mw.throwErr(err);
			next(err);
		}
		else {
			res.sendStatus(200);
		}
	})
	
	.get('/settings', (req,res)=>{
		res.render('settings');
	})
	.post('/settings', (req,res)=>{
		//TODO: Test validation here.  
	});
	
module.exports = router;