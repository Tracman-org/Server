var router = require('express').Router(),
	slug = require('slug'),
  mw = require('../middleware.js'),
  User = require('../models/user.js');

// Shortcut to favicon.ico
router.get('/favicon.ico', function(req,res){
	res.redirect('/static/img/icon/by/16-32-48.ico');
});	

// Index route
router.route('/')
	.get(function(req,res,next){
	
	// Logged in
	if (req.session.passport&&req.session.passport.user) {
		// Get user
		User.findById(req.session.passport.user, function(err, user){
			if (err){ mw.throwErr(req,err); }
			if (!user){ console.log('Already logged in user not found:', req.session.passport); next(); }
			// If user found: 
			else {
				// Open index
				res.render('index.html', {
					user: user,
					error: req.flash('error')[0],
					success: req.flash('succcess')[0]
				});
			}
			
		});
	// Not logged in
	}
	
	// Not logged in
	else {
		res.render('index.html', {
			error: req.flash('error')[0],
			success: req.flash('success')[0]
		});
	}
	
});

// Settings
router.route('/settings')
	
	// Get settings form
	.get(mw.ensureAuth, function(req,res,next){
		User.findById(req.session.passport.user, function(err,user){
			if (err){ console.log('Error finding settings for user:',err); mw.throwErr(req,err); }
			res.render('settings.html', {user:user});
		});
		
	// Set new settings
	}).post(mw.ensureAuth, function(req,res,next){
		User.findByIdAndUpdate(req.session.passport.user, {$set:{
			name: req.body.name,
			slug: slug(req.body.slug),
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
			res.redirect('/map#');
		});		
	})

	// Delete user account
	.delete(mw.ensureAuth, function(req,res,next){
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
	
router.route('/help')
	.get(mw.ensureAuth, function(req,res){
		res.render('help.html', {user:req.session.passport.user});
	});

module.exports = router;