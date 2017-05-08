'use strict';

const router = require('express').Router(),
  mw = require('../middleware.js'),
  User = require('../models.js').user;

router.get('/', mw.ensureAdmin,  (req,res)=>{
	
	User.find({}).sort({lastLogin:-1})
	.then( (found)=>{
		res.render('admin', {
			noFooter: '1',
			users: found,
			total: found.length
		});
	})
	.catch( (err)=>{ mw.throwErr(err,req); });
		
});
	
router.get('/delete/:usrid', mw.ensureAdmin,  (req,res,next)=>{
	
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