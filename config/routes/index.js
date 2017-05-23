'use strict';

const mw = require('../middleware.js'),
	env = require('../env/env.js'),
	mail = require('../mail.js'),
	router = require('express').Router(),
	request = require('request'),
	slug = require('slug'),
	xss = require('xss'),
	User = require('../models.js').user;

module.exports = router
	
	// Index
	.get('/', (req,res,next)=>{
		res.render('index', {active:'home'});
	})

	// Help
	.get('/help', (req,res)=>{
		res.render('help', {active:'help'});
	})
	
	// Contact
	.get('/contact', (req,res)=>{
		res.render('contact',{
			active: 'contact',
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
	
	// Terms of Service and Privacy Policy
	.get('/terms', (req,res)=>{
		res.render('terms', {active:'terms'});
	})
	.get('/privacy', (req,res)=>{
		res.render('privacy', {active:'privacy'});
	})
	
	// robots.txt
	.get('/robots.txt', (req,res)=>{ 
		res.type('text/plain');
		res.send("User-agent: *\n"+
			"Disallow: /map/*\n"
		);
	})
	
	// favicon.ico
	//TODO: Just serve it
	.get('/favicon.ico', (req,res)=>{
		res.redirect('/static/img/icon/by/16-32-48.ico');
	})
	
	// Endpoint to validate forms
	.get('/validate', (req,res,next)=>{
		
		// Validate unique slug
		if (req.query.slug) {
			User.findOne({ slug: slug(req.query.slug) })
			.then( (existingUser)=>{
				if (existingUser && existingUser.id!==req.user.id) {
					res.sendStatus(400);
				}
				else { res.sendStatus(200); }
			})
			.catch( (err)=>{
				console.error(err);
				res.sendStatus(500);
			});
		}
		
		// Validate unique email
		else if (req.query.email) {
			User.findOne({ email: req.query.email })
			.then( (existingUser)=>{
				if (existingUser && existingUser.id!==req.user.id) {
					res.sendStatus(400);
				}
				else { res.sendStatus(200); }
			})
			.catch( (err)=>{
				console.error(err);
				res.sendStatus(500);
			});
		}
		
		// Create slug
		else if (req.query.slugify) {
			res.send(slug(xss(req.query.slugify)));
		}
		
		// Sanitize for XSS
		else if (req.query.xss) {
			res.send(xss(req.query.xss));
		}
		
		// 404
		else { next(); }
		
	})
	
	// Link to androidapp in play store
	.get('/android', (req,res)=>{
		res.redirect('https://play.google.com/store/apps/details?id=us.keithirwin.tracman');
	})
	
	// Link to iphone app in the apple store
	// ... maybe someday
	.get('/ios', (req,res)=>{
		res.redirect('/help#why-is-there-no-ios-app');
	})

;
