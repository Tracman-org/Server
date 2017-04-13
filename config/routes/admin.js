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
		.catch( (err)=>{
			mw.throwErr(err);
		}).then( (found)=>{
			res.render('admin', {
				noFooter: '1',
				users: found
			});
		});
		
	} )
	
	.post( (req,res,next)=>{
		if (req.body.delete) {
			User.findOneAndRemove( {'_id':req.body.delete}, (err,user)=>{
				if (err){ req.flash('error', err.message); }
				else { req.flash('success', '<i>'+user.name+'</i> deleted.'); }
				res.redirect('/admin#users');
			} );
		} else { console.error(new Error('POST without action sent.  ')); next(); }
	} );

module.exports = router;