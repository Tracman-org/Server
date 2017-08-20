'use strict';

const router = require('express').Router(),
  mw = require('../middleware.js'),
	debug = require('debug')('tracman-routes-admin'),
  User = require('../models.js').user;

router.get('/', mw.ensureAdmin,  (req,res)=>{
	
	User.find({}).sort({lastLogin:-1})
	.then( (found)=>{
		res.render('admin', {
			active: 'admin',
			noFooter: '1',
			users: found,
			total: found.length
		});
	})
	.catch( (err)=>{ mw.throwErr(err,req); });
		
});
	
router.get('/delete/:usrid', mw.ensureAdmin,  (req,res,next)=>{
	
	debug(`/delete/${req.params.usrid} called`);
	
	User.findOneAndRemove({'_id':req.params.usrid})
	.then( (user)=>{
		req.flash('success', '<i>'+user.name+'</i> deleted.');
		res.redirect('/admin');
	})
	.catch( (err)=>{
		mw.throwErr(err,req);
		res.redirect('/admin');
	});
	
});

module.exports = router;
