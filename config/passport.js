'use strict';

const
	LocalStrategy = require('passport-local').Strategy,
	GoogleStrategy = require('passport-google-oauth20').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	GoogleTokenStrategy = require('passport-google-id-token'),
	FacebookTokenStrategy = require('passport-facebook-token'),
	TwitterTokenStrategy = require('passport-twitter-token'),
	env = require('./env.js'),
	mw = require('./middleware.js'),
	User = require('./models.js').user;
	
module.exports = (passport)=>{
	
	// Serialize/deserialize users
	passport.serializeUser((user,done)=>{
		done(null, user.id);
	});
	passport.deserializeUser((id,done)=>{
		User.findById(id, (err,user)=>{
			if(!err){ done(null, user); }
			else { done(err, null); }
		});
	});
	
	// Local
	passport.use('local', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, (req,email,password,done)=>{
		User.findOne({'email':email})
		.then( (user)=>{
			
			// No user with that email
			if (!user) {
				req.session.next = undefined;
				return done( null, false, req.flash('warning','Incorrect email or password.') );
			}
			
			// User exists
			else {
				
				// Check password
				user.validPassword( password, (err,res)=>{
					if (err){ return done(err); }
					
					// Password incorrect
					if (!res) {
						req.session.next = undefined;
						return done( null, false, req.flash('warning','Incorrect email or password.') );
					}
					
					// Successful login
					else { 
						user.lastLogin = Date.now();
						user.save();
						return done(null,user);
					}
					
				} );
			}
			
		})
		.catch( (err)=>{
			return done(err);
		});
	}
	));
	
	// Social login
	function socialLogin(req, service, profileId, done) {
		// console.log(`socialLogin() called`);
		let query = {};
		query['auth.'+service] = profileId;
		
		// Intent to log in
		if (!req.user) {
			// console.log(`Logging in with ${service}...`);
			User.findOne(query)
			.then( (user)=>{
				
				// Can't find user
				if (!user){
					
					// Lazy update from old googleId field
					if (service==='google') {
						User.findOne({ 'googleID': parseInt(profileId) })
						.then( (user)=>{
							
							// User exists with old schema
							if (user) {
								user.auth.google = profileId;
								user.googleId = undefined;
								user.save()
								.then( ()=>{
									console.info(`🗂️ Lazily updated schema for ${user.name}.`);
									req.session.flashType = 'success';
									req.session.flashMessage = "You have been logged in. ";
									return done(null, user);
								})
								.catch( (err)=>{
									mw.throwErr(err,req);
									return done(err);
								});
							} 
							
							// No such user
							else {
								req.session.flashType = 'warning';
								req.session.flashMessage = `There's no user for that ${service} account. `;
								return done();
							}
							
						})
						.catch ( (err)=>{
							mw.throwErr(err,req);
							return done(err);
						});
					}
					
					// No googleId either
					else {
						// console.log(`Couldn't find ${service} user.`);
						req.session.flashType = 'warning';
						req.session.flashMessage = `There's no user for that ${service} account. `;
						return done();
					}
				}
				
				// Successfull social login
				else {
					// console.log(`Found user: ${user}`);
					req.session.flashType = 'success';
					req.session.flashMessage = "You have been logged in.";
					return done(null, user);
				}
				
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				return done(err);
			});
		}
		
		// Intent to connect account
		else {
			// console.log(`Attempting to connect ${service} account...`);
			
			// Check for unique profileId
			User.findOne(query)
			.then( (existingUser)=>{
				
				// Social account already in use
				if (existingUser) {
					// console.log(`${service} account already in use.`);
					req.session.flashType = 'warning';
					req.session.flashMessage = `Another user is already connected to that ${service} account. `;
					return done();
				}
				
				// Connect to account
				else {
					// console.log(`Connecting ${service} account.`);
					req.user.auth[service] = profileId;
					req.user.save()
					.then( ()=>{
						req.session.flashType = 'success';
						req.session.flashMessage = `${mw.capitalize(service)} account connected. `;
						return done(null,req.user);
					} )
					.catch( (err)=>{
						return done(err);
					} );
				}
				
			})
			.catch( (err)=>{
				mw.throwErr(err,req);
				return done(err);
			});
			
		}
		
	}

	// Google
	passport.use('google', new GoogleStrategy({
			clientID: env.googleClientId,
			clientSecret: env.googleClientSecret,
			callbackURL: env.url+'/login/google/cb',
			passReqToCallback: true
		}, (req, accessToken, refreshToken, profile, done)=>{
			socialLogin(req, 'google', profile.id, done);
		}
	)).use('google-token', new GoogleTokenStrategy({
			clientID: env.googleClientId,
			passReqToCallback: true
		}, (req, parsedToken, googleId, done)=>{
			socialLogin(req,'google', googleId, done);
		}
	));
	
	// Facebook
	passport.use('facebook', new FacebookStrategy({
			clientID: env.facebookAppId,
			clientSecret: env.facebookAppSecret,
			callbackURL: env.url+'/login/facebook/cb',
			passReqToCallback: true
		}, (req, accessToken, refreshToken, profile, done)=>{
			socialLogin(req, 'facebook', profile.id, done);
		}
	)).use('facebook-token', new FacebookTokenStrategy({
			clientID: env.facebookAppId,
			clientSecret: env.facebookAppSecret,
			passReqToCallback: true
		}, (req, accessToken, refreshToken, profile, done)=>{
			socialLogin(req,'facebook', profile.id, done);
		}
	));
	
	// Twitter
	passport.use(new TwitterStrategy({
			consumerKey: env.twitterConsumerKey,
			consumerSecret: env.twitterConsumerSecret,
			callbackURL: env.url+'/login/twitter/cb',
			passReqToCallback: true
		}, (req, token, tokenSecret, profile, done)=>{
			socialLogin(req, 'twitter', profile.id, done);
		}
	)).use('twitter-token', new TwitterTokenStrategy({
			consumerKey: env.twitterConsumerKey,
			consumerSecret: env.twitterConsumerSecret,
			passReqToCallback: true
		}, (req, token, tokenSecret, profile, done)=>{
			socialLogin(req,'twitter', profile.id, done);
		}
	));

	return passport;
};