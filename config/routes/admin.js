var router = require('express').Router(),
  mw = require('../middleware.js'),
  mail = require('../mail.js'),
  User = require('../models/user.js'),
  Request = require('../models/request.js');

router.route('/requests')
	.all([mw.ensureAuth, mw.ensureAdmin], function(req,res,next){
		next();
	}).get(function(req,res){
		User.findById(req.session.passport.user, function(err, user){
			if (err){ req.flash('error', err.message); }
			Request.find({}, function(err, requests){
				if (err) { req.flash('error', err.message); }
				res.render('admin/requests.html', {
					user: user,
					noFooter: '1',
					requests: requests,
					success:req.flash('success')[0],
					error:req.flash('error')[0]
				});
			});
		});
	}).post(function(req,res){
		Request.findById(req.body.invite, function(err, request){
			if (err){ req.flash('error', err.message); }
			mail.sendInvite(request, function (err, raw) {
				if (err) { req.flash('error', err.message); }
				request.granted = Date.now();
				request.save(function(err) {
					if (err) { req.flash('error', err.message); }
				});
				req.flash('success', 'Invitation sent to <i>'+request.name+'</i>.');
				res.redirect('/admin/requests');
			});
		});
	});

router.get('/users', [mw.ensureAuth, mw.ensureAdmin], function(req,res){
	User.findById(req.session.passport.user, function(err, user){
		if (err){ req.flash('error', err.message); }
		User.find({}, function(err, users){
			if (err) { req.flash('error', err.message); }
			res.render('admin/users.html', {
				user: user,
				users: users,
				noFooter: '1',
				success:req.flash('success')[0],
				error:req.flash('error')[0]
			});
		});
	});
});
  
module.exports = router;