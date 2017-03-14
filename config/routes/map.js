var router = require('express').Router(),
  mw = require('../middleware.js'),
  slug = require('slug'),
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
				mapApi: secrets.googleMapsAPI,
				user: user,
				noFooter: '1',
				noHeader: (req.query.noheader)?req.query.noheader.match(/\d/)[0]:'',
				disp: (req.query.disp)?req.query.disp.match(/\d/)[0]:'' // 0=map, 1=streetview, 2=both
			});
		}
	}
		
});

// Set new user settings
router.post('/:slug?', mw.ensureAuth, function(req,res,next){
	User.findByIdAndUpdate(req.session.passport.user, {$set:{name: req.body.name,
		slug: slug(req.body.slug),
		email: req.body.email,
		settings: {
			units: req.body.units,
			defaultMap: req.body.map,
			defaultZoom: req.body.zoom,
			showSpeed: (req.body.showSpeed)?true:false,
			showAlt: (req.body.showAlt)?true:false,
			showStreetview: (req.body.showStreet)?true:false
		}
	}}, function(err, user){
		if (err) { console.log('Error updating user settings:',err); mw.throwErr(req,err); }
		else { req.flash('success', 'Settings updated.  '); }
		res.redirect('/map#');
	});		
});

// Delete user account
router.delete('/:slug?', mw.ensureAuth, function(req,res,next){
	User.findByIdAndRemove(
		req.session.passport.user,
		function(err) {
			if (err) { 
				console.log('Error deleting user:',err);
				mw.throwErr(req,err);
			} else { 
				req.flash('success', 'Your account has been deleted.  ');
				res.sendStatus(200);
			}
		}
	)
});

module.exports = router;