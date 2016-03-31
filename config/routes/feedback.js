var router = require('express').Router(),
  mail = require('../mail.js'),
  mw = require('../middleware.js');

router.route('/suggestion')
	.get(function(req,res){
		res.render('suggestion.html', {user:req.user});
	}).post(function(req,res){
		mail.sendSuggestion({
			name: (req.body.name)?req.body.name:req.user.name,
			email: (req.body.email)?req.body.email:req.user.email,
			suggestion: req.body.suggestion
		}, function (err, raw) {
			if (err){ mw.throwErr(req,err); }
			else { req.flash('success','Thanks for the suggestion! '); }
			res.redirect('/dashboard');
		});
	});

router.route('/bug')
  .all(mw.ensureAuth, function(req,res,next){
		next();
	}).get(function(req,res){
		res.render('bug.html', {
			user: req.user,
			errorMessage: req.flash('error-message')
		});
	}).post(function(req,res){
		mail.sendBugReport({
			source: (req.query.source)?req.body.name:'web',
			name: (req.body.name)?req.body.name:req.user.name,
			email: (req.body.email)?req.body.email:req.user.email,
			errorMessage: req.body.errorMessage,
			recreation: req.body.recreation,
			bug: req.body.bug
		}, function (err, raw) {
			if (err){ mw.throwErr(req,err); }
			else { req.flash('success','Thanks for the report! '); }
			res.redirect('/dashboard');
		});
	});

module.exports = router;