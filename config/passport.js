'use strict';

const
	LocalStrategy = require('passport-local').Strategy,
	GoogleStrategy = require('passport-google-oauth20').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
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
		User.findOne( {'email':email}, (err,user)=>{
			if (err){ return done(err); }
			
			// No user with that email
			if (!user) {
				req.session.next = undefined;
				return done( null, false, req.flash('danger','Incorrect email or password.') );
			}
			
			// User exists
			else {
				
				// Check password
				user.validPassword( password, (err,res)=>{
					if (err){ return done(err); }
					
					// Password incorrect
					if (!res) {
						req.session.next = undefined;
						return done( null, false, req.flash('danger','Incorrect email or password.') );
					}
					
					// Successful login
					else { 
						user.lastLogin = Date.now();
						user.save();
						return done(null,user);
					}
					
				} );
			}
		} );
	}
	));
	
	// Social login
	function socialLogin(req, service, profileId, done) {
		
		// Log in
		if (!req.user) {
			// console.log(`Logging in with ${service}.`);
			
			var query = {};
			query['auth.'+service] = profileId;
			User.findOne(query, (err,user)=>{
				if (err){ return done(err); }
				
				// Can't find user
				else if (!user){
					
					// Lazy update from old googleId field
					if (service==='google') {
						User.findOne( {'googleID':parseInt(profileId)}, (err,user)=>{
							if (err){ return done(err); }
							if (user) {
								user.auth.google = profileId;
								user.googleId = null;
								user.save( (err)=>{
									if (err){ mw.throwErr(err,req); }
									else { console.info(`🗂️ Lazily updated schema for ${user.name}.`); }
									return done(null, user);
								} );
							} else {
								req.flash('danger',`There's no user for that ${service} account. `);
								return done();
							}
						} );
					}
					
					// No googleId either
					else {
						req.flash('danger',`There's no user for that ${service} account. `);
						return done();
					}
				}
				
				// Successfull social login
				else {
					// console.log(`Found user: ${user}`);
					return done(null, user);
				}
			});
		}
		
		// Connect account
		else {
			// console.log(`Connecting ${service} account.`);
			req.user.auth[service] = profileId;
			req.user.save( (err)=>{
				if (err){ return done(err); }
				else { return done(null, req.user); }
			} );
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
	));

	return passport;
};