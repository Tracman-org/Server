'use strict';

const
	mw = require('./middleware.js'),
	mail = require('./mail.js'),
	User = require('./models.js').user,
	slug = require('slug'),
	crypto = require('crypto'),
	env = require('./env.js');

module.exports = (app, passport) => {

	// Methods for success and failure
	const
		loginOutcome = {
			failureRedirect: '/login',
			failureFlash: true
		},	
		connectOutcome = {
			failureRedirect: '/settings',
			failureFlash: true
		},
		loginCallback = (req,res)=>{
			res.redirect( req.session.next || '/map' );
		};
	
	// Login/-out
	app.route('/login')
		.get( (req,res)=>{
			if (req.isAuthenticated()){ loginCallback(); }
			else { res.render('login'); }
		})
		.post( passport.authenticate('local',loginOutcome), loginCallback );
	app.get('/logout', (req,res)=>{
		req.logout();
		req.flash('success',`You have been logged out.`);
		res.redirect(req.session.next || '/');
	});
	
	// Signup
	app.get('/signup', (req,res)=>{
		res.redirect('/login#signup');
	}).post('/signup', (req,res,next)=>{
		
		// Send token and alert user
		function sendToken(user){
			
			// Create a password token
			user.createToken((err,token)=>{
				if (err){ mw.throwErr(err,req); }
				
				// Email the instructions to continue
				mail.send({
					from: mail.from,
					to: `<${user.email}>`,
					subject: 'Complete your Tracman registration',
					text: mail.text(`Welcome to Tracman!  \n\nTo complete your registration, follow this link and set your password:\n${env.url}/settings/password/${token}`),
					html: mail.html(`<p>Welcome to Tracman! </p><p>To complete your registration, follow this link and set your password:<br><a href="${env.url}/settings/password/${token}">${env.url}/settings/password/${token}</a></p>`)
				}).catch((err)=>{
					mw.throwErr(err,req);
					res.redirect('/login#signup');
				}).then(()=>{
					req.flash('success', `An email has been sent to <u>${user.email}</u>. Check your inbox to complete your registration. `);
					res.redirect('/login');
				});
			});
			
		}
		
		// Check if somebody already has that email
		User.findOne({'email':req.body.email}, (err,user)=>{
			if (err){ mw.throwErr(err,req); }
			
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
				var generateSlug = new Promise((resolve,reject) => {
					(function checkSlug(s,cb){
						
						User.findOne({slug:s})
						.catch((err)=>{
							mw.throwErr(err,req);
						})
						.then((existingUser)=>{
							
							// Slug in use: generate a random one and retry
							if (existingUser){
								s = '';
								while (s.length<6) {
									s+='abcdefghijkmnpqrtuvwxy346789'.charAt(Math.floor(Math.random()*28));
								}
								checkSlug(s,cb);
							}
							
							// Unique slug: proceed
							else { cb(s); }
							
						});
						
					})(user.slug, (newSlug)=>{
						user.slug = newSlug;
						resolve();
					});
				});
				
				// Generate sk32
				var generateSk32 = new Promise((resolve,reject) => {
					crypto.randomBytes(32, (err,buf)=>{
						if (err) { mw.throwErr(err,req); }
						user.sk32 = buf.toString('hex');
						resolve();
					});
				});
				
				// Save user and send the token by email
				Promise.all([generateSlug, generateSk32])
					.catch(err => {
						mw.throwErr(err,req);
					}).then(() => {
						user.save( (err)=>{
							if (err){ mw.throwErr(err,req); }
							sendToken(user);
						});
					});
				
			}
			
		});
	});

	// Forgot password
	// app.route('/login/forgot')
	// 	.all( (req,res,next)=>{
	// 		if (req.isAuthenticated()){ res.redirect('/settings'); }
	// 		else { next(); }
	// 	})
	// 	.get( (req,res,next)=>{
	// 		res.render('forgot');
	// 	})
	// 	.post( (req,res,next)=>{

	// 		//TODO: Validate and sanitize email
	// 		// req.assert('email', 'Please enter a valid email address.').isEmail();
	// 		// req.sanitize('email').normalizeEmail({ remove_dots: false });

	// 		User.findOne( {'email':req.body.email}, (err,user)=>{
	// 			if (err){ next(err); }
	// 			else if (!user) {
	// 				req.flash('danger', `No user has <u>${req.body.email}</u> set as their email address. `);
	// 				res.redirect('/login/forgot');
	// 			} else {

	// 				// Set reset token to user
	// 				user.createToken( (err,token)=>{
	// 					if (err){ next(err); }

	// 					// Email reset link
	// 					mail({
	// 						from: '"Tracman" <NoReply@tracman.org>',
	// 						to: `"${user.name}"" <${user.email}>`,
	// 						subject: 'Reset your Tracman password',
	// 						text: `Hi, \n\nDid you request to reset your Tracman password?  If so, follow this link to do so:\n${env.url}/settings/password/${token}\n\nIf you didn't initiate this request, just ignore this email. `,
	// 						html: `<p>Hi, </p><p>Did you request to reset your Tracman password?  If so, follow this link to do so:<br><a href="${env.url}/settings/password/${token}">${env.url}/settings/password/${token}</a></p><p>If you didn't initiate this request, just ignore this email. </p>`
	// 					}).then(()=>{
	// 						req.flash('success', `An email has been sent to <u>${req.body.email}</u>. Check your email for instructions to reset your password. `);
	// 					res.redirect('/');
	// 					}).catch((err)=>{
	// 						next(err);
	// 					});

	// 				});
	// 			}
	// 		});

	// 	});

	// Social
	app.get('/login/:service', (req,res,next)=>{
		let service = req.params.service,
			sendParams = (service==='google')? {scope:['profile']} : null;
		
		// Social login
		if (!req.user) {
			passport.authenticate(service, sendParams)(req,res,next);
		}
		
		// Connect social account
		else if (!req.user.auth[service]) {
			passport.authorize(service, sendParams)(req,res,next);
		}
		
		// Disconnect social account
		else {
			req.user.auth[service] = undefined;
			req.user.save()
				.catch((err)=>{
					mw.throwErr(err,req);
					res.redirect('/settings');
				}).then(()=>{
					req.flash('success', `${mw.capitalize(service)} account disconnected. `);
					res.redirect('/settings');
				});
			
		}
	});
	app.get('/login/:service/cb', (req,res,next)=>{
		var service = req.params.service;
		if (!req.user) {
			passport.authenticate(service, loginOutcome)(req,res,next);
		} else {
			req.flash('success', `${mw.capitalize(service)} account connected. `);
			req.session.next = '/settings';
			passport.authenticate(service, connectOutcome)(req,res,next);
		}
	}, loginCallback);

	// Android auth
	//TODO: See if there's a better method
	app.get('/auth/google/idtoken', passport.authenticate('google-id-token'),	(req,res)=>{
		if (!req.user){ res.sendStatus(401); }
		else { res.send(req.user); }
	} );

};
