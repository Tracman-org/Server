var router = require('express').Router(),
  mw = require('../middleware.js'),
  slug = require('slug'),
  User = require('../models/user.js'),
  Request = require('../models/request.js');

router.get('/:invite', function(req,res,next){
	function associateUser(request,user){
		request.userId = user._id;
		request.save(function(err, raw){
			if (err){ mw.throwErr(req,err); }
		});
		req.logIn(user, function(err) {
			if (err) { mw.throwErr(req,err); }
			user.lastLogin = Date.now();
			user.save(function(err, raw) {
				if (err) { mw.throwErr(req,err); }
				res.redirect('/login');
			});
		});
	}
	User.findOne({requestId:req.params.invite}, function(err, existingUser) { // User already accepted invite
		if (err) { console.log('Could not find existing user: '+err); }
		if (existingUser && existingUser.gooogleID) { res.redirect('/login'); }
		else {
			Request.findById(req.params.invite, function(err, request) { // Check for granted invite
				if (err) { mw.throwErr(req,err); }
				if (!request) { next(); }
				else {
					if (existingUser) { // associate existing user with google account
						associateUser(request,existingUser);
					} else { // create new user
						(function checkSlug(s,cb) {
							console.log('checking ',s);
							User.findOne({slug:s}, function(err, existingUser){
								if (err) { console.log('Slug check error for ',slug(request.name).toLowerCase(),+':',err); }
								if (existingUser){
									s = '';
									while (s.length<6) {
										s+='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random()*62));
									}
									checkSlug(s,cb);
								} else { cb(s); }
							});
						})(slug(request.name).toLowerCase(), function(newSlug){
							newUser = new User({ // Create new user
								requestId: request._id,
								email: '',
								slug: newSlug,
								name: request.name,
								created: Date.now(),
								settings: {
									units: 'imperial',
									showSpeed: false,
									showTemp: false,
									showAlt: false,
									showStreetview: true
								}
							})
							newUser.save(function(err) {
								if (err) { mw.throwErr(req,err); }
								associateUser(request,newUser);
							});
						});
					}
				}
			});
		}
	});
});

module.exports = router;