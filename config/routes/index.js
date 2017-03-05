var router = require('express').Router(),
  mw = require('../middleware.js'),
  User = require('../models/user.js');
	
router.route('/')
.get(function(req,res,next){
	
	// Logged in
	if (req.session.passport&&req.session.passport.user) {
		// Get user
		User.findById(req.session.passport.user, function(err, user){
			if (err){ mw.throwErr(req,err); }
			if (!user){ console.log('Already logged in user not found:', req.session.passport); next(); }
			// If user found: 
			else {
				// Open index
				res.render('index.html', {
					user: user,
					error: req.flash('error')[0],
					success: req.flash('succcess')[0]
				});
			}
			
		});
	// Not logged in
	}
	
	// Not logged in
	else {
		res.render('index.html', {
			error: req.flash('error')[0],
			success: req.flash('success')[0]
		});
	}
	
});

module.exports = router;