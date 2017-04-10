'use strict';

const
	mw = require('./middleware.js'),
	mail = require('./mail.js'),
	User = require('./models.js').user,
	env = require('./env.js');

module.exports = function(app, passport) {
	
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
		loginCallback = function(req,res){
			res.redirect( req.session.returnTo || '/settings' );
			delete req.session.returnTo;
		};
	
	// Login/-out
	app.route('/login')
		.get( function(req,res){
			if (req.isAuthenticated()){ 
				res.redirect('/account'); }
			else { res.render('login'); }
		})
		.post( passport.authenticate('local',loginOutcome), loginCallback );
	app.get('/logout', function(req,res){
		req.logout();
		res.redirect('/');
	});
	
	// Signup
	app.post('/signup', function(req,res,next){
		User.findOne({'email':req.body.email}, function(err,user){
			if (err){ next(err); }
			
			// User already exists
			else if (user){
				req.flash('warning','A user with that email already exists!  If you forgot your password, use <a href="/login/forgot">this form</a>.');
				res.redirect('/login');
			} else {
				
				// Create user
				var newUser = new User();
				newUser.email = req.body.email;
				newUser.created = Date.now();
				
				newUser.createToken(function(err,token){
					if (err){ next(err); }
					mail({
						from: '"Trackmap" <accounts@trackmap.tech>',
						to: req.body.email,
						subject: 'Complete your Trackmap registration',
						text: `Welcome to trackmap!  \n\nTo complete your registration, follow this link and set your password:\n${env.url}/account/password/${token}`, // plaintext body
						html: `<p>Welcome to trackmap!  </p><p>To complete your registration, follow this link and set your password:<br><a href="${env.url}/account/password/${token}">${env.url}/account/password/${token}</a></p>` // html body
					}).then(function(){
						req.flash('success',`An email has been sent to <u>${req.body.email}</u>.  Check your inbox to complete your registration.`);
						res.redirect('/');
					}).catch(function(err){
						next(err);
					});
				});
				
			}
		});
	});
	
	// Forgot password
	app.route('/login/forgot')
		.all( function(req,res,next){
			if (req.isAuthenticated()){ res.redirect('/account'); }
			else { next(); }
		})
		.get( function(req,res,next){
			res.render('forgot');
		})
		.post( function(req,res,next){
			
			//TODO: Validate and sanitize email
			// req.assert('email', 'Please enter a valid email address.').isEmail();
			// req.sanitize('email').normalizeEmail({ remove_dots: false });
			
			User.findOne({'email':req.body.email},function(err,user){
				if (err){ next(err); }
				else if (!user) {
					req.flash('danger', `No user has <u>${req.body.email}</u> set as their email address. `);
					res.redirect('/login/forgot');
				} else {
					
					// Set reset token to user
					user.createToken( function(err,token){
						if (err){ next(err); }
						
						// Email reset link
						mail({
							from: '"Trackmap" <accounts@trackmap.tech>',
							to: user.email,
							subject: 'Reset your Trackmap password',
							text: `Hi, \n\nDid you request to reset your trackmap password?  If so, follow this link to do so:\n${env.url}/account/password/${token}\n\nIf you didn't initiate this request, just ignore this email. `,
							html: `<p>Hi, </p><p>Did you request to reset your trackmap password?  If so, follow this link to do so:<br><a href="${env.url}/account/password/${token}">${env.url}/account/password/${token}</a></p><p>If you didn't initiate this request, just ignore this email. </p>`
						}).then(function(){
							req.flash('success', `An email has been sent to <u>${req.body.email}</u>. Check your email for instructions to reset your password. `);
						res.redirect('/');
						}).catch(function(err){
							next(err);
						});
						
					});
				}
			});

		});
	
	// Social
	app.get('/login/:service', function(req,res,next){
		var service = req.params.service;
		if (service==='google'){
			var sendParams = {scope:['profile']};
		}
		if (!req.user) { // Social login
			passport.authenticate(service, sendParams)(req,res,next);
		} else if (!req.user.auth[service]) { // Connect social account
			passport.authorize(service, sendParams)(req,res,next);
		} else { // Disconnect social account
			req.user.auth[service] = undefined;
			req.user.save(function(err){
				if (err){ return next(err); }
				else {
					req.flash('success', `${mw.capitalize(service)} account disconnected. `);
					res.redirect('/account');
				}
			});

		}
	});
	app.get('/login/:service/cb', function(req,res,next){
		var service = req.params.service;
		if (!req.user) {
			passport.authenticate(service, loginOutcome)(req,res,next);
		} else {
			req.flash('success', `${mw.capitalize(service)} account connected. `);
			req.session.returnTo = '/account';
			passport.authenticate(service, connectOutcome)(req,res,next);
		}
	}, loginCallback);
	
	// Old google auth
	// app.get('/auth/google', passport.authenticate('google', { scope: [
	// 	'https://www.googleapis.com/auth/plus.login',
	// 	'https://www.googleapis.com/auth/plus.profile.emails.read'
	// ] }));
	// app.get('/auth/google/callback', passport.authenticate('google', {
	// 	failureRedirect: '/',
	// 	failureFlash: true,
	// 	successRedirect: '/',
	// 	successFlash: true
	// } ));
	
	// Android auth
	//TODO: See if there's a better method
	app.get('/auth/google/idtoken', passport.authenticate('google-id-token'),	function (req,res) {
		if (!req.user) { res.sendStatus(401); }
		else { res.send(req.user); }
	} );
	
};

// passport.use(new GoogleStrategy({
// 	clientID: env.googleClientId,
// 	clientSecret: env.googleClientSecret,
// 	callbackURL: env.url+'/auth/google/callback',
// 	passReqToCallback: true
// }, function(req, accessToken, refreshToken, profile, done) {
	
// 	// Check for user
// 	User.findOne({googleID: profile.id}, function(err, user){
		
// 		// Error
// 		if (err) { console.log('Error finding user with google ID: '+profile.id+'\n'+err); }
		
// 		// User found
// 		if (!err && user !== null) /* Log user in */ {
// 			if (!user.name) { user.name=profile.displayName; }
// 			user.lastLogin = Date.now();
// 			user.save(function (err, raw) {
// 				if (err) { throwErr(req,err); }
// 			}); done(null, user);
// 		}
		
// 		// User not found
// 		else /* create user */ {
// 			user = new User();
// 			user.googleID = profile.id;
// 			user.name = profile.displayName;
// 			user.email = profile.emails[0].value;
// 			user.slug = slug(profile.displayName).toLowerCase();
// 			user.created = Date.now();
// 			user.lastLogin = Date.now();
// 			// user.settings = { units:'standard', defaultMap:'road', defaultZoom:11, showSpeed:false, showTemp:false, showAlt:false, showStreetview:false },
// 			// user.last = { lat:0, lon:0, dir:0, alt:0, spd:0 },
// 			// user.isPro = false;
// 			// user.isAdmin = false;
// 			var cbc = 2;
// 			var successMessage, failMessage;
			
// 			// Generate slug
// 			(function checkSlug(s,cb) {
// 				//console.log('checking ',s);
// 				User.findOne({slug:s}, function(err, existingUser){
// 					if (err) { console.log('No user found for ',slug,':',err); }
// 					if (existingUser){
// 						s = '';
// 						while (s.length<6) {
// 							s+='abcdefghijkmnpqrtuvwxy346789'.charAt(Math.floor(Math.random()*28));
// 						}
// 						checkSlug(s,cb);
// 					} else { cb(s); }
// 				});
// 			})(user.slug, function(newSlug){
// 				user.slug = newSlug;
// 				if (cbc>1) /* waiting on other calls */ { cbc--; }
// 				else { done(null, user, { success:successMessage, failure:failMessage }); }
// 			});
			
// 			// Generate sk32
// 			crypto.randomBytes(32, function(err,buf) {
// 				if (err) {console.log('Unable to get random bytes:',err);}
// 				if (!buf) {console.log('Unable to get random buffer');}
// 				else {
// 					user.sk32 = buf.toString('hex');
// 					user.save(function(err) {
// 						if (err) {
// 							console.log('Error saving new user '+err);
// 							var failMessage = 'Something went wrong creating your account.  Would you like to <a href="/bug">report this error</a>?';
// 						} else { successMessage = 'Your account has been created.  Next maybe you should download the <a href="/android">android app</a>.  ' }
// 						if (cbc>1) /* waiting on other calls */ { cbc--; }
// 						else { done(null, user, { success:successMessage, failure:failMessage }); }
// 					});
// 				}
// 			});
		
// 		}
		
// 	});
		
// }));

// passport.use(new GoogleTokenStrategy({
// 	clientID: env.googleClientId
// }, function(parsedToken, googleId, done) {
// 	User.findOne({googleID:googleId}, function(err, user) {
// 		if (err) { 
// 			console.log('Error finding user for gToken login with google profile ID: '+googleId+'\n'+err); }
// 		if (!err && user !== null) { // Log in
// 			user.lastLogin = Date.now();
// 			user.save(function (err) {
// 				if (err) { 
// 					console.log('Error saving user\'s lastLogin for gToken login with google profile ID: '+googleId+'\n'+err); }
// 			});
// 			return done(err, user);
// 		} else { // No such user
// 			done(null, false);
// 		}
// 	});
// }));
