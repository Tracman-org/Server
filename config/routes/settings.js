'use strict';

const slug = require('slug'),
	xss = require('xss'),
	mw = require('../middleware.js'),
	User = require('../models.js').user,
	mail = require('../mail.js'),
	env = require('../env.js'),
	router = require('express').Router();


// Settings form
router.route('/')
	.all(mw.ensureAuth, function(req,res,next){
		next();
	})
	
	// Get settings form
	.get(function(req,res,next){
		User.findById(req.session.passport.user, function(err,user){
			if (err){ console.log('Error finding settings for user:',err); mw.throwErr(req,err); }
			res.render('settings');
		});
	})
	
	// Set new settings
	.post(function(req,res,next){
		User.findByIdAndUpdate(req.session.passport.user, {$set:{
			name: xss(req.body.name),
			slug: slug(xss(req.body.slug)),
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
			res.redirect('/settings');
		});		
	})

	// Delete user account
	.delete(function(req,res,next){
		User.findByIdAndRemove( req.session.passport.user,
			function(err) {
				if (err) { 
					console.log('Error deleting user:',err);
					mw.throwErr(req,err);
				} else { 
					req.flash('success', 'Your account has been deleted.  ');
					res.redirect('/');
				}
			}
		);
	});


// Set password
router.route('/password')
	.all(mw.ensureAuth,function(req,res,next){
		next();
	})
	
	.get(function(req,res,next){
		req.user.createToken(function(err,token){
      if (err){ next(err); }
      mail.send({
        to: mail.to(req.user),
        from: mail.from,
        subject: 'Request to change your Tracman password',
        text: mail.text(`A request has been made to change your tracman password.  If you did not initiate this request, please contact support at keith@tracman.org.  \n\nTo change your password, follow this link:\n${env.url}/settings/password/${token}. `),
        html: mail.html(`<p>A request has been made to change your tracman password.  If you did not initiate this request, please contact support at <a href="mailto:keith@tracman.org">keith@tracman.org</a>.  </p><p>To change your password, follow this link:<br><a href="${env.url}/settings/password/${token}">${env.url}/settings/password/${token}</a>. </p>`)
      }).then(function(){
        req.flash('success',`An email has been sent to <u>${req.user.email}</u>.  Check your inbox to complete your password change. `);
        res.redirect(req.query.next||'/settings');
      }).catch(function(err){
        next(err);
      });
    });
	});


// Tracman pro
router.route('/pro').all(mw.ensureAuth, function(req,res,next){
		next();
	})
	
	// Get info about pro
	.get(function(req,res,next){
		User.findById(req.session.passport.user, function(err, user){
			if (err){ mw.throwErr(req,err); }
			if (!user){ next(); }
			else { res.render('pro'); }
		});
	})
	
	// Join Tracman pro
	.post(function(req,res){
		User.findByIdAndUpdate(req.session.passport.user,
			{$set:{ isPro:true }},
			function(err, user){
				if (err){ mw.throwErr(req,err); }
				else { req.flash('success','You have been signed up for pro. '); }
				res.redirect('/map');
			}
		);
	});
	
module.exports = router;