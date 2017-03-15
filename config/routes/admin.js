'use strict';

var router = require('express').Router(),
  mw = require('../middleware.js'),
  User = require('../models/user.js');

router.route('/')
	.all(mw.ensureAdmin, function(req,res,next){
		next();
	}).get(function(req,res){
		
		var cbc = 0;
		var checkCBC = function(req,res,err){
			if (err) { 
				req.flash('error', err.message);
				console.log(err); 
			}
			if (cbc<1){ cbc++; }
			else { // done
				res.render('admin.html', {
					noFooter: '1',
					success:req.flash('success')[0],
					error:req.flash('error')[0]
				});
			}
		};
		
		User.findById(req.session.passport.user, function(err, found) {
			res.locals.user = found;
			checkCBC(req,res,err);
		});

		User.find({}).sort({lastLogin:-1}).exec(function(err, found){
			res.locals.users = found;
			checkCBC(req,res,err);
		});
		
	});
	
router.route('/users')
	.all(mw.ensureAdmin, function(req,res,next){
		next();
	}).post(function(req,res,next){
		if (req.body.delete) {
			User.findOneAndRemove({'_id':req.body.delete}, function(err,user){
				if (err){ req.flash('error', err.message); }
				else { req.flash('success', '<i>'+user.name+'</i> deleted.'); }
				res.redirect('/admin#users');
			});
		} else { console.log('ERROR! POST without action sent.  '); next(); }
	});
  
module.exports = router;