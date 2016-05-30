// var router = require('express').Router(),
//   mw = require('../middleware.js'),
//   slug = require('slug'),
//   User = require('../models/user.js');

// router.route('/')
// .all(mw.ensureAuth, function(req,res,next){
// 	next();
// }).get(function(req,res,next){
// 	User.findById(req.session.passport.user, function(err, user){
// 		if (err){ mw.throwErr(req,err); }
// 		if (!user){ next(); }
// 		else if (req.session.returnTo && req.query.rd) {
// 			res.redirect(req.session.returnTo);
// 			delete req.session.returnTo;
// 		} else { res.render('dashboard.html', {
// 			user: user,
// 			success: req.flash('success')[0],
// 			error: req.flash('error')[0]
// 		}); }
// 	});
// }).post(function(req,res){
// 	User.findByIdAndUpdate(req.session.passport.user, {$set:{
// 		name: req.body.name,
// 		slug: slug(req.body.slug),
// 		settings: {
// 			units: req.body.units,
// 			defaultMap: req.body.map,
// 			defaultZoom: req.body.zoom,
// 			showSpeed: (req.body.showSpeed)?true:false,
// 			showAlt: (req.body.showAlt)?true:false,
// 			showStreetview: (req.body.showStreet)?true:false
// 		}
// 	}}, function(err, user){
// 		if (err) { mw.throwErr(req,err); }
// 		else { req.flash('success', 'Settings updated.  '); }
// 		res.redirect('/dashboard');
// 	});
// });

// module.exports = router;