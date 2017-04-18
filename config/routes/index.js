'use strict';

const mw = require('../middleware.js'),
	router = require('express').Router(),
	slug = require('slug'),
	xss = require('xss'),
  User = require('../models.js').user;

// Index
router.get('/', (req,res,next)=>{
	res.render('index');
});

// Help
router.get('/help', mw.ensureAuth, (req,res)=>{
	res.render('help');
});

// Terms of Service and Privacy Policy
router.get('/terms', (req,res)=>{
	res.render('terms');
})
.get('/privacy', (req,res)=>{
	res.render('privacy');
});

// robots.txt
router.get('/robots.txt', (req,res)=>{ 
	res.type('text/plain');
	res.send("User-agent: *\n"+
		"Disallow: /map/*\n"
	);
});

// favicon.ico
router.get('/favicon.ico', (req,res)=>{
	res.redirect('/static/img/icon/by/16-32-48.ico');
});	

// Endpoint to validate forms
router.get('/validate', (req,res)=>{
	
	// Validate unique slug
	if (req.query.slug) {
		User.findOne({ slug: slug(req.query.slug) })
		.then( (existingUser)=>{
			if (existingUser && existingUser.id!==req.user.id) {
				res.sendStatus(400);
			}
			else { res.sendStatus(200); }
		})
		.catch( (err)=>{ mw.throwErr(err); });
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
		.catch( (err)=>{ mw.throwErr(err); });
	}
	
	// Create slug
	else if (req.query.slugify) {
		res.send(slug(xss(req.query.slugify)));
	}
	
	else if (req.query.xss) {
		res.send(xss(req.query.xss));
	}
	
});

// Link to androidapp in play store
router.get('/android', (req,res)=>{
	res.redirect('https://play.google.com/store/apps/details?id=us.keithirwin.tracman');
});

// Link to iphone app in the apple store
// ... maybe someday
router.get('/ios', (req,res)=>{
	res.redirect('/help#why-is-there-no-ios-app');
});

module.exports = router;
