'use strict';

const slug = require('slug'),
	xss = require('xss'),
	mw = require('../middleware.js'),
	User = require('../models/user.js'),
	router = require('express').Router();

// Index
router.get('/', function(req,res,next){
	res.render('index.html');
});

// Settings
router.route('/settings').all(mw.ensureAuth, function(req,res,next){
		next();
	})
	
	// Get settings form
	.get(function(req,res,next){
		User.findById(req.session.passport.user, function(err,user){
			if (err){ console.log('Error finding settings for user:',err); mw.throwErr(req,err); }
			res.render('settings.html');
		});
	})
	
	// Set new settings
	.post(function(req,res,next){
		User.findByIdAndUpdate(req.session.passport.user, {$set:{
			name: xss(req.body.name),
			slug: slug(xss(req.body.slug)),
			email: req.body.email,
			settings: {
				units: req.body.units,
				defaultMap: req.body.map,
				defaultZoom: req.body.zoom,
				showSpeed: (req.body.showSpeed)?true:false,
				showAlt: (req.body.showAlt)?true:false,
				showStreetview: (req.body.showStreet)?true:false
			}
		}}, function(err, user){
			if (err) { console.log('Error updating user settings:',err); mw.throwErr(req,err); }
			else { req.flash('success', 'Settings updated.  '); }
			res.redirect('/settings');
		});		
	})

	// Delete user account
	.delete(function(req,res,next){
		User.findByIdAndRemove( req.session.passport.user,
			function(err) {
				if (err) { 
					console.log('Error deleting user:',err);
					mw.throwErr(req,err);
				} else { 
					req.flash('success', 'Your account has been deleted.  ');
					res.redirect('/');
				}
			}
		);
	});

// Tracman pro
router.route('/pro').all(mw.ensureAuth, function(req,res,next){
		next();
	})
	
	// Get info about pro
	.get(function(req,res,next){
		User.findById(req.session.passport.user, function(err, user){
			if (err){ mw.throwErr(req,err); }
			if (!user){ next(); }
			else { res.render('pro.html'); }
		});
	})
	
	// Join Tracman pro
	.post(function(req,res){
		User.findByIdAndUpdate(req.session.passport.user,
			{$set:{ isPro:true }},
			function(err, user){
				if (err){ mw.throwErr(req,err); }
				else { req.flash('success','You have been signed up for pro. '); }
				res.redirect('/map');
			}
		);
	});

// Help
router.route('/help').get(mw.ensureAuth, function(req,res){
		res.render('help.html');
	});

// Terms of Service
router.get('/terms', function(req,res){
	res.render('terms.html');
});

module.exports = router;