var router = require('express').Router(),
  mw = require('../middleware.js'),
  mail = require('../mail.js'),
  secret = require('../secrets.js'),
  User = require('../models/user.js'),
  Request = require('../models/request.js');
	
router.route('/')
.get(function(req,res,next){
	
	// Logged in
	if (req.session.passport) {
		// Get user
		User.findById(req.session.passport.user, function(err, user){
			if (err){ mw.throwErr(req,err); }
			if (!user){ console.log(req.session.passport); next(); }
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
	} else {
		 // Show index
		res.render('index.html', {
			error: req.flash('error')[0],
			success: req.flash('success')[0],
			inviteSuccess: req.flash('request-success')[0],
			inviteError: req.flash('request-error')[0]
		});
	}
}).post(function(req,res){ // Create request
	Request.findOne({email:req.body.email}, function(err, request) {
		if (err){ mw.throwErr(req,err); }
		if (request){ // Already requested with this email
			req.flash('request-error', 'Invite already requested!  ');
			res.redirect('/#get');
		} else { // Send new request
			request = new Request({
				name: req.body.name,
				email: req.body.email,
				beg: req.body.why,
				requestedTime: Date.now()
			}); request.save(function(err) {
				if (err){ mw.throwErr(req,err); }
				mail.mailgun.messages().send({
					from: 'Tracman Requests <requests@tracman.org>',
					to: 'Keith Irwin <tracman@keithirwin.us>',
					subject: 'New Tracman Invite request',
					html: '<p>'+req.body.name+' requested a Tracman invite.  </p><p>'+req.body.why+'</p><p><a href="https://tracman.org/admin/requests">See all invites</a></p>',
					text: '\n'+req.body.name+' requested a Tracman invite.  \n\n'+req.body.why+'\n\nhttps://tracman.org/admin/requests'
				}, function(err,body){
					if (err){ mw.throwErr(req,err); }
					else { req.flash('request-success', 'Invite requested!  '); }
					res.redirect('/#get');
				});
			});
		}
	});
});

module.exports = router;