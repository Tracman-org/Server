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
	.all( mw.ensureAuth, (req,res,next)=>{
		next();
	} )

	// Get settings form
	.get( (req,res,next)=>{
		User.findById( req.user, (err,user)=>{
			if (err){ mw.throwErr(err,req); }
			res.render('settings');
		} );
	} )

	// Set new settings
	.post( (req,res,next)=>{
		User.findByIdAndUpdate(req.user, {$set:{
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
		}}, (err,user)=>{
			if (err) {
				mw.throwErr(err,req);
				res.redirect('/settings');
			}
			else {
				req.flash('success', 'Settings updated.  ');
				res.redirect('/settings');
			}
		});
	} )

	// Delete user account
	.delete( (req,res,next)=>{
		User.findByIdAndRemove( req.user, (err)=>{
			if (err) {
				mw.throwErr(err,req);
				res.redirect('/settings');
			} else {
				req.flash('success', 'Your account has been deleted.  ');
				res.redirect('/');
			}
		} );
	} );


// Set password
router.route('/password/')
	.all( mw.ensureAuth, (req,res,next)=>{
		next();
	} )

	// Email user a token, proceed at /password/:token
	.get( (req,res,next)=>{

		// Create token for password change
		req.user.createToken( (err,token)=>{
			if (err){ next(err); }

			// Confirm password change request by email.
			mail.send({
				to: mail.to(req.user),
				from: mail.from,
				subject: 'Request to change your Tracman password',
				text: mail.text(`A request has been made to change your tracman password.  If you did not initiate this request, please contact support at keith@tracman.org.  \n\nTo change your password, follow this link:\n${env.url}/settings/password/${token}. \n\nThis request will expire in 1 hour. `),
				html: mail.html(`<p>A request has been made to change your tracman password.  If you did not initiate this request, please contact support at <a href="mailto:keith@tracman.org">keith@tracman.org</a>.  </p><p>To change your password, follow this link:<br><a href="${env.url}/settings/password/${token}">${env.url}/settings/password/${token}</a>. </p><p>This request will expire in 1 hour. </p>`)
			}).catch( err=>{
				mw.throwErr(err,req);
				res.redirect('/login#login');
			}).then( ()=>{

				// Alert user to check email.
				req.flash('success',`An email has been sent to <u>${req.user.email}</u>.  Check your inbox to complete your password change. `);
				res.redirect('/login#login');

			});

		} );

	} );

router.route('/password/:token')

	// Check token
	.all( (req,res,next)=>{
		User
			.findOne({'auth.passToken': req.params.token})
			.where('auth.tokenExpires').gt(Date.now())
			.catch((err)=>{
				mw.throwErr(err,req);
			})
			.then((user) => {
				if (!user) {
					req.flash('danger', 'Password reset token is invalid or has expired. ');
					res.redirect( (req.isAuthenticated)?'/settings':'/login' );
				} else {
					res.locals.passwordUser = user;
					next();
				}
			});
	} )

	// Show password change form
	.get( (req,res)=>{
		res.render('password');
	} )

	.post( (req,res,next)=>{

		//TODO: Validate password

		// Delete token
		res.locals.passwordUser.auth.passToken = undefined;
		res.locals.passwordUser.auth.tokenExpires = undefined;

		// Create hash
		res.locals.passwordUser.generateHash( req.body.password, (err,hash)=>{
			if (err){ mw.throwErr(err,req); }
			else {

				// Save new password to db
				res.locals.passwordUser.auth.password = hash;
				res.locals.passwordUser.save( (err)=>{
					if (err){
						mw.throwErr(err,req);
						res.redirect('/login#signup');
					}
					else {
						req.flash('success', 'Password set.  You can use it to log in now. ');
						res.redirect('/login#login');
					}
				});

			}
		} );

	} );


// Tracman pro
router.route('/pro')
	.all( mw.ensureAuth, (req,res,next)=>{
		next();
	} )

	// Get info about pro
	.get( (req,res,next)=>{
		res.render('pro');
	} )

	// Join Tracman pro
	.post( (req,res)=>{
		User.findByIdAndUpdate(req.user.id,
			{$set:{ isPro:true }},
			(err,user)=>{
				if (err){ mw.throwErr(err,req); }
				else { req.flash('success','You have been signed up for pro. '); }
				res.redirect('/map');
			}
		);
	} );

module.exports = router;