'use strict';

const slug = require('slug'),
	xss = require('xss'),
	mellt = require('mellt'),
	mw = require('../middleware.js'),
	User = require('../models.js').user,
	mail = require('../mail.js'),
	env = require('../env.js'),
	router = require('express').Router();

// Validate email addresses
function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

// Settings form
router.route('/')
	.all( mw.ensureAuth, (req,res,next)=>{
		next();
	} )

	// Get settings form
	.get( (req,res)=>{
		res.render('settings');
	} )

	// Set new settings
	.post( (req,res,next)=>{
		
		function setSettings(){
				
			// Set values
			req.user.name = xss(req.body.name);
			req.user.slug = slug(xss(req.body.slug));
			req.user.settings = {
					units: req.body.units,
					defaultMap: req.body.map,
					defaultZoom: req.body.zoom,
					showScale: (req.body.showScale)?true:false,
					showSpeed: (req.body.showSpeed)?true:false,
					showAlt: (req.body.showAlt)?true:false,
					showStreetview: (req.body.showStreet)?true:false
				};
				
			// Save user and send response
			req.user.save()
			.then( ()=>{
				req.flash('success', 'Settings updated. ');
				res.redirect('/settings');
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				res.redirect('/settings');
			});
			
		}
		
		// Validations
		if (req.body.slug==='') {
			req.flash('warning', `You must supply a slug.  `);
			res.redirect('/settings');
		}
		else if (!validateEmail(req.body.email)) {
			req.flash('warning', `<u>${req.body.email}</u> is not a valid email address.  `);
			res.redirect('/settings');
		}
		
		else {
			
			// Email changed
			if (req.user.email!==req.body.email) {
				req.user.newEmail = req.body.email;
				
				// Create token
				req.user.createEmailToken((err,token)=>{
					if (err){
						mw.throwErr(err,req);
						res.redirect(req.session.next||'/settings');
					}
					
					// Send token to user by email
					mail.send({
						to: `"${req.user.name}" <${req.body.email}>`,
						from: mail.from,
						subject: 'Confirm your new email address for Tracman',
						text: mail.text(`A request has been made to change your Tracman email address.  If you did not initiate this request, please disregard it.  \n\nTo confirm your email, follow this link:\n${env.url}/settings/email/${token}. `),
						html: mail.html(`<p>A request has been made to change your Tracman email address.  If you did not initiate this request, please disregard it.  </p><p>To confirm your email, follow this link:<br><a href="${env.url}/settings/email/${token}">${env.url}/settings/email/${token}</a>. </p>`)
					})
					.then( ()=>{
						req.flash('warning',`An email has been sent to <u>${req.body.email}</u>.  Check your inbox to confirm your new email address. `);
						setSettings();
					})
					.catch( (err)=>{
						mw.throwErr(err,req);
					});
					
				});
			}
			
			// Email not changed
			else { setSettings(); }
			
		}
		
	} )

	// Delete user account
	.delete( (req,res,next)=>{
		
		//TODO: Reenter password?
		
		User.findByIdAndRemove(req.user)
			.then( ()=>{
				req.flash('success', 'Your account has been deleted.  ');
				res.redirect('/');
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				res.redirect('/settings');
			});
			
	} );

// Confirm email address
router.get('/email/:token', mw.ensureAuth, (req,res,next)=>{
		
		// Check token
		if ( req.user.emailToken===req.params.token) {
			
			// Set new email
			req.user.email = req.user.newEmail;
			req.user.save()
			.then( ()=>{
				// Delete token and newEmail
				req.user.emailToken = undefined;
				req.user.newEmail = undefined;
				req.user.save();
			})
			.then( ()=>{
				// Report success
				req.flash('success',`Your email has been set to <u>${req.user.email}</u>. `);
				res.redirect('/settings');
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				res.redirect(req.session.next||'/settings');
			});
			
		}
		
		// Invalid token
		else {
			req.flash('danger', 'Email confirmation token is invalid. ');
			res.redirect('/settings');
		}
		
	} );

// Set password
router.route('/password')
	.all( mw.ensureAuth, (req,res,next)=>{
		next();
	} )

	// Email user a token, proceed at /password/:token
	.get( (req,res,next)=>{

		// Create token for password change
		req.user.createPassToken( (err,token)=>{
			if (err){
				mw.throwErr(err,req);
				res.redirect(req.session.next||'/settings');
			}
			
			// Confirm password change request by email.
			mail.send({
				to: mail.to(req.user),
				from: mail.from,
				subject: 'Request to change your Tracman password',
				text: mail.text(`A request has been made to change your tracman password.  If you did not initiate this request, please contact support at keith@tracman.org.  \n\nTo change your password, follow this link:\n${env.url}/settings/password/${token}. \n\nThis request will expire in 1 hour. `),
				html: mail.html(`<p>A request has been made to change your tracman password.  If you did not initiate this request, please contact support at <a href="mailto:keith@tracman.org">keith@tracman.org</a>.  </p><p>To change your password, follow this link:<br><a href="${env.url}/settings/password/${token}">${env.url}/settings/password/${token}</a>. </p><p>This request will expire in 1 hour. </p>`)
			})
			.then( ()=>{
				// Alert user to check email.
				req.flash('success',`An email has been sent to <u>${req.user.email}</u>.  Check your inbox to complete your password change. `);
				res.redirect('/login#login');
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				res.redirect('/login#login');
			});
			
		});

	} );

router.route('/password/:token')

	// Check token
	.all( (req,res,next)=>{
		User
			.findOne({'auth.passToken': req.params.token})
			.where('auth.passTokenExpires').gt(Date.now())
			.then((user) => {
				if (!user) {
					req.flash('danger', 'Password reset token is invalid or has expired. ');
					res.redirect( (req.isAuthenticated)?'/settings':'/login' );
				} else {
					res.locals.passwordUser = user;
					next();
				}
			})
			.catch((err)=>{
				mw.throwErr(err,req);
				res.redirect('/password');
			});
	} )

	// Show password change form
	.get( (req,res)=>{
		res.render('password');
	} )
	
	// Set new password
	.post( (req,res,next)=>{
		
		// Validate password
		let daysToCrack = mellt.CheckPassword(req.body.password);
		if (daysToCrack<10) {
			mw.throwErr(new Error(`That password could be cracked in ${daysToCrack} days!  Come up with a more complex password that would take at least 10 days to crack. `));
			res.redirect(`/settings/password/${req.params.token}`);
		}
		
		else {
			
			// Delete token
			res.locals.passwordUser.auth.passToken = undefined;
			res.locals.passwordUser.auth.passTokenExpires = undefined;
			
			// Create hash
			res.locals.passwordUser.generateHash( req.body.password, (err,hash)=>{
				if (err){
					mw.throwErr(err,req);
					res.redirect(`/password/${req.params.token}`);
				}
				else {
					
					// Save new password to db
					res.locals.passwordUser.auth.password = hash;
					res.locals.passwordUser.save()
					.then( ()=>{
						req.flash('success', 'Password set.  You can use it to log in now. ');
						res.redirect('/login#login');
					})
					.catch( (err)=>{
						mw.throwErr(err,req);
						res.redirect('/login#signup');
					});
					
				}
			} );
			
		}
		
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
				{$set:{ isPro:true }})
			.then( (user)=>{
				req.flash('success','You have been signed up for pro. ');
				res.redirect(req.session.next||'/settings');
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				res.redirect('/pro');	
			});
	} );

module.exports = router;
