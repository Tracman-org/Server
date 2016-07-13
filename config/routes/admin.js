var router = require('express').Router(),
	fs= require('fs'),
  mw = require('../middleware.js'),
  mail = require('../mail.js'),
  User = require('../models/user.js'),
  Request = require('../models/request.js');

router.route('/')
	.all(mw.ensureAdmin, function(req,res,next){
		next();
	}).get(function(req,res){
		
		var cbc = 0;
		var checkCBC = function(req,res,err){
			if (err) { req.flash('error', err.message); }
			if (cbc<2){ cbc++; }
			else { // done	
				res.render('admin.html', {
					noFooter: '1',
					success:req.flash('success')[0],
					error:req.flash('error')[0]
				});
			}
		}
		
		User.findById(req.session.passport.user, function(err, found) {
			res.locals.user = found;
			checkCBC(req,res,err);
		});
		
		Request.find({}).sort({requestedTime:-1}).exec(function(err, found){
			res.locals.requests = found;
			checkCBC(req,res,err);
		});
		
		User.find({}).sort({lastLogin:-1}).exec(function(err, found){
			res.locals.users = found;
			checkCBC(req,res,err);
		});
		
	});
	
router.route('/requests')
	.all(mw.ensureAdmin, function(req,res,next){
		if (err) {
			req.flash('error',err);
			req.flash('error-message',err);
		}
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
					res.redirect('/admin#requests');
				});
			});
		} else if (req.body.delete) {
			Request.findOneAndRemove({'_id':req.body.delete}, function(err,request){
				if (err){ req.flash('error', err.message); }
				else { req.flash('success', 'Request deleted.'); }
				res.redirect('/admin#requests');
			});
		} else { console.log('ERROR! POST without action sent.  '); next(); }
	});

router.route('/users')
	.all(mw.ensureAdmin, function(req,res,next){
		if (err) {
			req.flash('error',err);
			req.flash('error-message',err);
		}
	}).post(function(req,res){
		if (req.body.delete) {
			User.findOneAndRemove({'_id':req.body.delete}, function(err,user){
				if (err){ req.flash('error', err.message); }
				else { req.flash('success', '<i>'+user.name+'</i> deleted.'); }
				res.redirect('/admin#users');
			});
		} else { console.log('ERROR! POST without action sent.  '); next(); }
	});
  
module.exports = router;