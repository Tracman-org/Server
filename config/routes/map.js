'use strict';

const router = require('express').Router(),
  mw = require('../middleware.js'),
  env = require('../env/env.js'),
  User = require('../models.js').user;
  

// Redirect to real slug
router.get('/', mw.ensureAuth, (req,res)=>{
	if (req.query.new){
		res.redirect(`/map/${req.user.slug}?new=1`);
	}
	else {
		res.redirect(`/map/${req.user.slug}`);
	}
});

// Show map
router.get('/:slug?', (req,res,next)=>{
	
	User.findOne({slug:req.params.slug})
	.then( (mapuser)=>{
		if (!mapuser){ next(); } //404
		else {
			res.render('map', {
				mapuser: mapuser,
				mapApi: env.googleMapsAPI,
				user: req.user,
				noFooter: '1',
				noHeader: (req.query.noheader)?req.query.noheader.match(/\d/)[0]:0,
				disp: (req.query.disp)?req.query.disp.match(/\d/)[0]:2, // 0=map, 1=streetview, 2=both
				newuserurl: (req.query.new)? env.url+'/map/'+req.params.slug : ''
			});
		}
	}).catch( (err)=>{
		mw.throwErr(err,req);
	});
		
});

module.exports = router;
