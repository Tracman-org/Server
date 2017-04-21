'use strict';

const router = require('express').Router(),
  mw = require('../middleware.js'),
  User = require('../models.js').user;

router.route('/')
	.all(mw.ensureAdmin, (req,res,next)=>{
		next();
	} )
	
	.get( (req,res)=>{
		
		User.find({}).sort({lastLogin:-1})
		.then( (found)=>{
			res.render('admin', {
				noFooter: '1',
				users: found
			});
		})
		.catch( (err)=>{ mw.throwErr(err,req); });
		
	} )
	
	.post( (req,res,next)=>{
		if (req.body.delete) {
			User.findOneAndRemove({'_id':req.body.delete})
			.then( (user)=>{
				req.flash('success', '<i>'+user.name+'</i> deleted.');
				res.redirect('/admin#users');
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				res.redirect('/admin#users');
			});
		}
		else { 
			let err = new Error('POST without action sent.  ');
			err.status = 500; 
			next();
		}
	} );

module.exports = router;