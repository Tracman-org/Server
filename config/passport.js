'use strict';

const
	LocalStrategy = require('passport-local').Strategy,
	GoogleStrategy = require('passport-google-oauth20').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	env = require('./env.js'),
	mw = require('./middleware.js'),
	User = require('./models.js').user;
	
module.exports = function(passport) {
	
	// Serialize/deserialize users
	passport.serializeUser(function(user,done) {
		done(null, user.id);
	});
	passport.deserializeUser(function(id,done) {
		User.findById(id, function(err, user) {
			if(!err){ done(null, user); }
			else { done(err, null); }
		});
	});
	
	// Signup
	// passport.use('signup', new LocalStrategy({
	// 	usernameField: 'email',
	// 	passwordField: 'password',
	// 	passReqToCallback : true
	// }, function(req, email, password, done) {
	// process.nextTick(function() {
	// 	User.findOne({'email':email }, function(err, user) {
	// 		if (err){ return done(err); }
			
			// // Check for existing user
			// if (user) {
			// 	return done( null, false, req.flash('warning','That email is already in use. Try logging in below.') );
				
			// // Create user
			// } else {
			// 	var newUser = new User();
			// 	newUser.email = email;
			// 	newUser.created = Date.now();
			// 	newUser.lastLogin = Date.now();
			// 	newUser.generateHash(password, function(err, hash){
			// 		if (err){ return done(err); }
			// 		newUser.auth.password = hash;
			// 		newUser.save(function(err) {
			// 			if (err){ return done(err); }
			// 			return done( null, newUser );
			// 		});
			// 	});
			// }
			
	// 	});    
	// });
	// })
	// );
	
	// Local
	passport.use('local', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback : true
	}, function(req, email, password, done) {
		User.findOne({ 'email':email }, function (err, user) {
			if (err){ return done(err); }
			
			// Wrong username
			if (!user) {
				return done( null, false, req.flash('danger','No account exists for that email.') );
			// Username correct, password incorrect
			} else {
				// Check password
				user.validPassword(password, function(err,res){
					if (err){ console.log('Passport error:\n',err); }
					if (!res) { // Password incorrect
						return done( null, false, req.flash('danger','Incorrect password.') );
					} else { // Successful login
						user.lastLogin = Date.now();
						user.save();
						return done( null, user );
					}
				});
			}
		});
	}
	));
	
	// Social login
	function socialLogin(req, service, profileId, done) {
		
		// Log in
		if (!req.user) {
			// console.log(`Logging in with ${service}.`);
			
			var query = {};
			query['auth.'+service] = profileId;
			User.findOne(query, function (err, user) {
				if (err){ return done(err); }
				else if (!user){
					// console.log('User not found.');
					
					// Lazy update from old googleId field
					if (service==='google') {
						User.findOne({'googleID':parseInt(profileId)}, function(err,user){
							// console.log(`searched for user with googleID ${profileId}`);
							if (err){ mw.throwErr(err,req); }
							if (user) {
								// console.log(`Lazily updating schema for ${user.name}.`);
								user.auth.google = profileId;
								user.googleId = null;
								user.save(function(err){
									if (err){ mw.throwErr(err,req); }
									return done(null, user);
								});
							} else {
								req.flash('danger',`There's no user for that ${service} account. `);
								return done();
							}
						});
					} else {
						
						req.flash('danger',`There's no user for that ${service} account. `);
						return done();
					}
				}
				else {
					// console.log(`Found user: ${user}`);
					return done(null, user);
				}
			});
		}
		
		// Connect account
		else {
			console.log(`Connecting ${service} account.`);
			req.user.auth[service] = profileId;
			req.user.save(function(err){
				if (err){ return done(err); }
				else { return done(null, req.user); }
			});
		}
		
	}

	// Google
	passport.use('google', new GoogleStrategy({
			clientID: env.googleClientId,
			clientSecret: env.googleClientSecret,
			callbackURL: env.url+'/login/google/cb',
			passReqToCallback: true
		}, function(req, accessToken, refreshToken, profile, done) {
			socialLogin(req, 'google', profile.id, done);
		}
	));
	
	// Facebook
	passport.use('facebook', new FacebookStrategy({
			clientID: env.facebookAppId,
			clientSecret: env.facebookAppSecret,
			callbackURL: env.url+'/login/facebook/cb',
			passReqToCallback: true
		}, function(req, accessToken, refreshToken, profile, done) {
			socialLogin(req, 'facebook', profile.id, done);
		}
	));
	
	// Twitter
	passport.use(new TwitterStrategy({
			consumerKey: env.twitterConsumerKey,
			consumerSecret: env.twitterConsumerSecret,
			callbackURL: env.url+'/login/twitter/cb',
			passReqToCallback: true
		}, function(req, token, tokenSecret, profile, done) {
			socialLogin(req, 'twitter', profile.id, done);
		}
	));

	return passport;
};