'use strict';

const router = require('express').Router(),
  slug = require('slug'),
  User = require('../models.js').user;

// robots.txt
router.get('/robots.txt', function(req,res){ 
	res.type('text/plain');
	res.send("User-agent: *\n"+
		"Disallow: /map/*\n"
	);
});

// favicon.ico
router.get('/favicon.ico', function(req,res){
	res.redirect('/static/img/icon/by/16-32-48.ico');
});	

// Endpoint to validate forms
router.get('/validate', function(req,res){
	if (req.query.slug) { // validate unique slug
		User.findOne({slug:slug(req.query.slug)}, function(err, existingUser){
			if (err) { console.log('/validate error:',err); }
			if (existingUser && existingUser.id!==req.session.passport.user) { res.sendStatus(400); }
			else { res.sendStatus(200); }
		});
	}
});

// Link to android app in play store
router.get('/android', function(req,res){
	res.redirect('https://play.google.com/store/apps/details?id=us.keithirwin.tracman');
});

module.exports = router;