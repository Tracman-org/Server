'use strict';
//TODO: Use promises

const router = require('express').Router(),
  mw = require('../middleware.js'),
  env = require('../env.js'),
  User = require('../models.js').user;

// Redirect to real slug
router.get('/', mw.ensureAuth, (req,res)=>{
	res.redirect(`/map/${req.user.slug}`);
});

// Show map
router.get('/:slug?', (req,res,next)=>{
	var mapuser='', user='', cbc=0;
	
	// Confirm sucessful queries
	function checkQuery(err,found) {	
		if (err){ mw.throwErr(err,req); }
		if (found){ return found; }
	}
	
	// Call renderMap() on completion
	function checkCBC() {
		cbc+=1;
		if (cbc>1){ renderMap(); }
	}
	
	// QUERIES
	// Get logged in user -> user
	if (req.isAuthenticated()) {
		User.findById(req.user, function(err, found) {
			user = checkQuery(err,found);
			checkCBC();
		});
	}	else { checkCBC(); }
	// Get tracked user -> mapuser
	if (req.params.slug) {
		User.findOne({slug:req.params.slug}, function(err, found) {
			mapuser = checkQuery(err,found);
			checkCBC();
		});
	} else { checkCBC(); }
	
	// Show map
	function renderMap() {
		// GET /map shows logged-in user's map
		if (!mapuser && !user) {
			res.redirect('/');
		} else {
			if (user && !mapuser) { mapuser = user; }
			res.render('map', {
				mapuser: mapuser,
				mapApi: env.googleMapsAPI,
				user: user,
				noFooter: '1',
				noHeader: (req.query.noheader)?req.query.noheader.match(/\d/)[0]:'',
				disp: (req.query.disp)?req.query.disp.match(/\d/)[0]:'' // 0=map, 1=streetview, 2=both
			});
		}
	}
		
});

module.exports = router;