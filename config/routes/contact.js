'use strict';

const env = require('../env/env.js'),
	request = require('request'),
	mw = require('../middleware.js'),
	mail = require('../mail.js'),
	router = require('express').Router();

module.exports = router

// Display contact form
.get('/contact', (req,res)=>{
	res.render('contact', {active:'contact',
		sitekey: env.recaptchaSitekey
	});
})
	.post('/contact', (req,res,next)=>{
		
		// Confirm captcha
		request.post( 'https://www.google.com/recaptcha/api/siteverify', {form:{
			secret: env.recaptchaSecret,
			response: req.body['g-recaptcha-response'],
			remoteip: req.ip
		}}, (err, response, body)=>{
			
			// Check for errors
			if (err){
				mw.throwErr(err,req);
				res.redirect('/contact');
			}
			if (response.statusCode!==200) {
				let err = new Error('Bad response from reCaptcha service');
				mw.throwErr(err,req);
				res.redirect('/contact');
			}
			else {
				
				// Captcha succeeded
				if (JSON.parse(body).success){
					mail.send({
						from: `${req.body.name} <${req.body.email}>`,
						to: `Tracman Contact <contact@tracman.org>`,
						subject: req.body.subject||'A message',
						text: req.body.message
					})
					.then(()=>{
						req.flash('success', `Your message has been sent. `);
						res.redirect(req.session.next || '/');
					})
					.catch((err)=>{
						mw.throwErr(err,req);
						res.redirect('/contact');
					});
				}
				
				// Captcha failed
				else {
					let err = new Error('Failed reCaptcha');
					mw.throwErr(err,req);
					res.redirect('/contact');
				}
				
			}
		}
);
		
		//TODO: Check req.body.g-recaptcha-response
		
		
		
	})