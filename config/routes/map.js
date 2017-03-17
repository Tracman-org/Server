'use strict';

const router = require('express').Router(),
  mw = require('../middleware.js'),
  secrets = require('../secrets.js'),
  User = require('../models/user.js');

// Show map
router.get('/:slug?', function(req,res,next){
	var mapuser='', user='', cbc=0;
	
	// Confirm sucessful queries
	function checkQuery(err,found) {	
		if (err){ mw.throwErr(req,err); }
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
		User.findById(req.session.passport.user, function(err, found) {
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
			res.render('map.html', {
				mapuser: mapuser,
				mapApi: secrets.mapAPI,
				user: user,
				noFooter: '1',
				noHeader: (req.query.noheader)?req.query.noheader.match(/\d/)[0]:'',
				disp: (req.query.disp)?req.query.disp.match(/\d/)[0]:'' // 0=map, 1=streetview, 2=both
			});
		}
	}
		
});

module.exports = router;
