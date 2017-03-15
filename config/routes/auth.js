'use strict';

var router = require('express').Router(),
  passport = require('passport');
  
router.get('/login', function(req,res){
	res.redirect('/auth/google');
});
router.get('/logout', function(req,res){
	req.logout(); // Needs to clear cookies?
	res.redirect('/');
});

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

router.get('/auth/google/idtoken', passport.authenticate('google-id-token'),	function (req,res) {
	if (!req.user) { res.sendStatus(401); }
	else { res.send(req.user); }
} );

module.exports = router;