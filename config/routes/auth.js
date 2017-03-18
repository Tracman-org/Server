'use strict';

const router = require('express').Router(),
  passport = require('passport');
  
// Routes
router.get('/login', function(req,res){
	res.redirect('/auth/google');
});
router.get('/logout', function(req,res){
	req.logout(); // Needs to clear cookies?
	req.flash('success', 'You have been logged out.  ');
	res.redirect('/');
});

// Web app auth
router.get('/auth/google', passport.authenticate('google', { scope: [
	'https://www.googleapis.com/auth/plus.login',
	'https://www.googleapis.com/auth/plus.profile.emails.read'
] }));
router.get('/auth/google/callback', passport.authenticate('google', {
	failureRedirect: '/',
	failureFlash: true,
	successRedirect: '/',
	successFlash: true
} ));

// Android auth
router.get('/auth/google/idtoken', passport.authenticate('google-id-token'),	function (req,res) {
	if (!req.user) { res.sendStatus(401); }
	else { res.send(req.user); }
} );

module.exports = router;