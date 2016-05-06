var router = require('express').Router(),
  mw = require('../middleware.js'),
  User = require('../models/user.js'),
  Request = require('../models/request.js');

router.get('/:invite', function(req,res,next){
	User.findOne({requestId:req.params.invite}, function(err, existingUser) { // User already accepted invite
		if (err) { console.log('routes.js:121 ERROR: '+err); }
		if (existingUser) { res.redirect('/login'); }
		else {
			Request.findById(req.params.invite, function(err, request) { // Check for granted invite
				if (err) { mw.throwErr(req,err); }
				if (!request) { next(); }
				else {
					new User({ // Create new user
						requestId: request._id,
						email: '',
						slug: request._id,
						name: request.name,
						created: Date.now(),
						settings: {
							units: 'imperial',
							showSpeed: false,
							showTemp: false,
							showAlt: false,
							showStreetview: true
						}
					}).save(function(err) {
						if (err) { mw.throwErr(req,err); }
						User.findOne({requestId:request._id}, function(err, user) {
							if (err) { mw.throwErr(req,err); }
							if (user) {
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
						});
					});
				}
			});
		}
	});
});

module.exports = router;