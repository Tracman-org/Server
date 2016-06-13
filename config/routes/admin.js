var router = require('express').Router(),
	fs= require('fs'),
  mw = require('../middleware.js'),
  mail = require('../mail.js'),
  User = require('../models/user.js'),
  Request = require('../models/request.js');

router.route('/')
	.all(mw.ensureAdmin, function(req,res,next){
		fs.readFile(__dirname+'/../../adminMongo/config/app.json', 'utf-8', function(err,data) {
			if (err) {console.log('Couldn\'t find adminMongo\'s config/app.json due to an error:',err);}
			if (!data) {console.log('Couldn\'t find adminMongo\'s config/app.json');}
			else {
				res.redirect( req.protocol +'://'+ req.get('host') +':'+ JSON.parse(data).app['port'] +'/Local/tracman' );
			}
		});
	});

router.route('/requests')
	.all(mw.ensureAdmin, function(req,res,next){
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
		if (req.body.invite) {
			Request.findById(req.body.invite, function(err,request){
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
		} else if (req.body.delete) {
			Request.findOneAndRemove({'_id':req.body.delete}, function(err,request){
				if (err){ req.flash('error', err.message); }
				else { req.flash('success', 'Request deleted.'); }
				res.redirect('/admin/requests');
			});
		} else { console.log('ERROR! POST without action sent.  '); next(); }
	});

router.route('/users')
	.all(mw.ensureAdmin, function(req,res,next) {
		next();
	}).get(function(req,res){
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
	}).post(function(req,res){
		if (req.body.delete) {
			User.findOneAndRemove({'_id':req.body.delete}, function(err,user){
				if (err){ req.flash('error', err.message); }
				else { req.flash('success', '<i>'+user.name+'</i> deleted.'); }
				res.redirect('/admin/users');
			});
		} else { console.log('ERROR! POST without action sent.  '); next(); }
	});
  
module.exports = router;