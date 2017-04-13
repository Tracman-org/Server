'use strict';

const mw = require('../middleware.js'),
	router = require('express').Router(),
	slug = require('slug'),
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
	if (req.query.slug) { // validate unique slug
		User.findOne( {slug:slug(req.query.slug)}, (err,existingUser)=>{
			if (err) { console.log('/validate error:',err); }
			if (existingUser && existingUser.id!==req.user) { res.sendStatus(400); }
			else { res.sendStatus(200); }
		} );
	}
});

// Link to androidapp in play store
router.get('/android', (req,res)=>{
	res.redirect('https://play.google.com/store/apps/details?id=us.keithirwin.tracman');
});

// Link to iphone app in the apple store
router.get('/ios', (req,res)=>{
	res.sendStatus(404);
	//TODO: Add link to info about why there's no ios app
});

module.exports = router;