'use strict';

const
	mw = require('../middleware.js'),
	mail = require('../mail.js'),
	User = require('../models.js').user,
	crypto = require('crypto'),
	moment = require('moment'),
	env = require('../env/env.js');

module.exports = (app, passport) => {

	// Methods for success and failure
	const
		loginOutcome = {
			failureRedirect: '/login',
			failureFlash: true
		}, 
		loginCallback = (req,res)=>{
			//console.log(`Login callback called... redirecting to ${req.session.next}`);
			req.flash(req.session.flashType,req.session.flashMessage);
			req.session.flashType = undefined;
			req.session.flashMessage = undefined;
			res.redirect( req.session.next || '/map' );
		},
		appLoginCallback = (req,res,next)=>{
			//console.log('appLoginCallback called.');
			if (req.user){ res.send(req.user); }
			else { 
				let err = new Error("Unauthorized");
				err.status = 401;
				next(err);
			}
		};
	
	// Login/-out
	app.route('/login')
		.get( (req,res)=>{
			
			// Already logged in
			if (req.isAuthenticated()) { loginCallback(req,res); }
			
			// Show login page
			else { res.render('login'); }
		
		})
		.post( passport.authenticate('local',loginOutcome), loginCallback );
	app.get('/logout', (req,res)=>{
		req.logout();
		req.flash('success',`You have been logged out.`);
		res.redirect( req.session.next || '/' );
	});
	
	// Signup
	app.route('/signup')
		.get( (req,res)=>{
			res.redirect('/login#signup');
		})
		.post( (req,res,next)=>{
			
			// Send token and alert user
			function sendToken(user){
				
				// Create a password token
				user.createPassToken((err,token,expires)=>{
					if (err){
						mw.throwErr(err,req);
						res.redirect('/login#signup');
					}
					else {
					
						// Figure out expiration time
						let expirationTimeString = (req.query.tz)?
							moment(expires).utcOffset(req.query.tz).toDate().toLocaleTimeString(req.acceptsLanguages[0]):
							moment(expires).toDate().toLocaleTimeString(req.acceptsLanguages[0])+" UTC";
						
						// Email the instructions to continue
						mail.send({
								from: mail.from,
								to: `<${user.email}>`,
								subject: 'Complete your Tracman registration',
								text: mail.text(`Welcome to Tracman!  \n\nTo complete your registration, follow this link and set your password:\n${env.url}/settings/password/${token}\n\nThis link will expire at ${expirationTimeString}.  `),
								html: mail.html(`<p>Welcome to Tracman! </p><p>To complete your registration, follow this link and set your password:<br><a href="${env.url}/settings/password/${token}">${env.url}/settings/password/${token}</a></p><p>This link will expire at ${expirationTimeString}. </p>`)
							})
						.then(()=>{
							req.flash('success', `An email has been sent to <u>${user.email}</u>. Check your inbox and follow the link to complete your registration. (Your registration link will expire in one hour). `);
							res.redirect('/login');
						})
						.catch((err)=>{
							mw.throwErr(err,req);
							res.redirect('/login#signup');
						});
						
					}
				});
				
			}
			
			// Validate email
			req.checkBody('email', 'Please enter a valid email address.').isEmail();
			req.sanitizeBody('email').normalizeEmail({remove_dots:false});
			
			// Check if somebody already has that email
			User.findOne({'email':req.body.email})
			.then( (user)=>{
				
				// User already exists
				if (user && user.auth.password) {
					req.flash('warning','A user with that email already exists!  If you forgot your password, you can <a href="/login/forgot">reset it here</a>.');
					res.redirect('/login#login');
					next();
				}
				
				// User exists but hasn't created a password yet
				else if (user) {
					// Send another token (or the same one if it hasn't expired)
					sendToken(user);
				}
				
				// Create user
				else {
					
					user = new User();
					user.created = Date.now();
					user.email = req.body.email;
					user.slug = slug(user.email.substring(0, user.email.indexOf('@')));
					
					// Generate unique slug
					const slug = new Promise((resolve,reject) => {
						(function checkSlug(s,cb){
							
							User.findOne({slug:s})
							.then((existingUser)=>{
								
								// Slug in use: generate a random one and retry
								if (existingUser){
									crypto.randomBytes(6)
									.then( (buf)=>{
										s = buf.toString('hex');
										checkSlug(s,cb);
									})
									.catch( (err)=>{
										mw.throwErr(err,req);
										reject();
									});
								}
								
								// Unique slug: proceed
								else { cb(s); }
								
							})
							.catch((err)=>{
								mw.throwErr(err,req);
								reject();
							});
							
						})(user.slug, (newSlug)=>{
							user.slug = newSlug;
							resolve();
						});
					});
					
					// Generate sk32
					const sk32 = new Promise((resolve,reject) => {
						crypto.randomBytes(32)
						.then( (buf)=>{
							user.sk32 = buf.toString('hex');
							resolve();
						})
						.catch( (err)=>{
							mw.throwErr(err,req);
							reject();
						});
					});
					
					// Save user and send the token by email
					Promise.all([slug, sk32])
					.then( ()=>{ user.save(); })
					.then( ()=>{ sendToken(user); })
					.catch( (err)=>{
						mw.throwErr(err,req);
						res.redirect('/login#signup');
					});
					
				}
				
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				res.redirect('/signup');
			});
				
		});
	
	// Forgot password
	app.route('/login/forgot')
		.all( (req,res,next)=>{
			if (req.isAuthenticated()){ loginCallback(req,res); }
			else { next(); }
		} )
		.get( (req,res,next)=>{
			res.render('forgot');
		} )
		.post( (req,res,next)=>{
			
			// Validate email
			req.checkBody('email', 'Please enter a valid email address.').isEmail();
			req.sanitizeBody('email').normalizeEmail({remove_dots:false});
			
			User.findOne({'email':req.body.email})
				.then( (user)=>{
					
					// No user with that email
					if (!user) {
						// Don't let on that no such user exists, to prevent dictionary attacks
						req.flash('success', `If an account exists with the email <u>${req.body.email}</u>, an email has been sent there with a password reset link. `);
						res.redirect('/login');
					}
					
					// User with that email does exist
					else {
						
						// Create reset token
						user.createPassToken( (err,token)=>{
							if (err){ next(err); }
							
							// Email reset link
							mail.send({
								from: mail.from,
								to: mail.to(user),
								subject: 'Reset your Tracman password',
								text: mail.text(`Hi, \n\nDid you request to reset your Tracman password?  If so, follow this link to do so:\n${env.url}/settings/password/${token}\n\nIf you didn't initiate this request, just ignore this email. `),
								html: mail.html(`<p>Hi, </p><p>Did you request to reset your Tracman password?  If so, follow this link to do so:<br><a href="${env.url}/settings/password/${token}">${env.url}/settings/password/${token}</a></p><p>If you didn't initiate this request, just ignore this email. </p>`)
							}).then(()=>{
								req.flash('success', `If an account exists with the email <u>${req.body.email}</u>, an email has been sent there with a password reset link. `);
								res.redirect('/login');
							}).catch((err)=>{
								mw.throwErr(err,req);
								res.redirect('/login');
							});
	
						});
						
					}
					
				}).catch( (err)=>{
					mw.throwErr(err,req);
					res.redirect('/login/forgot');
				});
			
		} );
	
	// Android
	app.post('/login/app', passport.authenticate('local'), appLoginCallback);
	
	// Token-based (android social)
	app.get(['/login/app/google','/auth/google/idtoken'], passport.authenticate('google-token'), appLoginCallback);
	// app.get('/login/app/facebook', passport.authenticate('facebook-token'), appLoginCallback);
	// app.get('/login/app/twitter', passport.authenticate('twitter-token'), appLoginCallback);
	
	// Social
	app.get('/login/:service', (req,res,next)=>{
		let service = req.params.service,
			sendParams = (service==='google')?{scope:['https://www.googleapis.com/auth/userinfo.profile']}:null;
		
		// Social login
		if (!req.user) {
			//console.log(`Attempting to login with ${service} with params: ${JSON.stringify(sendParams)}...`);
			passport.authenticate(service, sendParams)(req,res,next);
		}
		
		// Connect social account
		else if (!req.user.auth[service]) {
			//console.log(`Attempting to connect ${service} account...`);
			passport.authorize(service, sendParams)(req,res,next);
		}
		
		// Disconnect social account
		else {
			//console.log(`Attempting to disconnect ${service} account...`);
			req.user.auth[service] = undefined;
			req.user.save()
			.then(()=>{
				req.flash('success', `${mw.capitalize(service)} account disconnected. `);
				res.redirect('/settings');
			})
			.catch((err)=>{
				mw.throwErr(err,req);
				res.redirect('/settings');
			});
		}
		
	});
	app.get('/login/google/cb', passport.authenticate('google',loginOutcome), loginCallback	);
	app.get('/login/facebook/cb', passport.authenticate('facebook',loginOutcome), loginCallback );
	app.get('/login/twitter/cb', passport.authenticate('twitter',loginOutcome), loginCallback );
	
};
