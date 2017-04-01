'use strict';

var vars = require('./env.js'),
	User = require('./models.js').user,
	LocalStrategy = require('passport-local').Strategy,
	GoogleStrategy = require('passport-google-oauth20').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy;
	
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
		if (!req.user) { // Log in
			var query = {};
			query['auth.'+service] = profileId;
			User.findOne(query, function (err, user) {
				if (err){ return done(err); }
				else if (!user){ return done(); }
				else { return done(null, user); }
			});
		} else {
			req.user.auth[service] = profileId;
			req.user.save(function(err){
				if (err){ return done(err); }
				else { return done(null, req.user); }
			});
		}
	}

	// Google
	passport.use('google', new GoogleStrategy({
			clientID: vars.googleClientId,
			clientSecret: vars.googleClientSecret,
			callbackURL: vars.url+'/login/google/cb',
			passReqToCallback: true
		}, function(req, accessToken, refreshToken, profile, done) {
			socialLogin(req, 'google', profile.id, done);
		}
	));
	
	// Facebook
	passport.use('facebook', new FacebookStrategy({
			clientID: vars.facebookAppId,
			clientSecret: vars.facebookAppSecret,
			callbackURL: vars.url+'/login/facebook/cb',
			passReqToCallback: true
		}, function(req, accessToken, refreshToken, profile, done) {
			socialLogin(req, 'facebook', profile.id, done);
		}
	));
	
	// Twitter
	passport.use(new TwitterStrategy({
			consumerKey: vars.twitterConsumerKey,
			consumerSecret: vars.twitterConsumerSecret,
			callbackURL: vars.url+'/login/twitter/cb',
			passReqToCallback: true
		}, function(req, token, tokenSecret, profile, done) {
			socialLogin(req, 'twitter', profile.id, done);
		}
	));

	return passport;
};