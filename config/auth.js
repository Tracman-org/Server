'use strict';

const passport = require('passport'),
	slug = require('slug'),
	crypto = require('crypto'),
	secret = require('./secrets.js'),
	User = require('./models/user.js'),
	GoogleStrategy = require('passport-google-oauth2').Strategy,
	GoogleTokenStrategy = require('passport-google-id-token');

passport.use(new GoogleStrategy({
	clientID: secret.googleClientId,
	clientSecret: secret.googleClientSecret,
	callbackURL: secret.url+'/auth/google/callback',
	passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
	
	// Check for user
	User.findOne({googleID: profile.id}, function(err, user){
		
		// Error
		if (err) { console.log('Error finding user with google ID: '+profile.id+'\n'+err); }
		
		// User found
		if (!err && user !== null) /* Log user in */ {
			if (!user.name) { user.name=profile.displayName; }
			user.lastLogin = Date.now();
			user.save(function (err, raw) {
				if (err) { throwErr(req,err); }
			}); done(null, user);
		}
		
		// User not found
		else /* create user */ {
			user = new User();
			user.googleID = profile.id;
			user.name = profile.displayName;
			user.email = profile.emails[0].value;
			user.slug = slug(profile.displayName).toLowerCase();
			user.created = Date.now();
			user.lastLogin = Date.now();
			// user.settings = { units:'standard', defaultMap:'road', defaultZoom:11, showSpeed:false, showTemp:false, showAlt:false, showStreetview:false },
			// user.last = { lat:0, lon:0, dir:0, alt:0, spd:0 },
			// user.isPro = false;
			// user.isAdmin = false;
			var cbc = 2;
			var successMessage, failMessage;
			
			// Generate slug
			(function checkSlug(s,cb) {
				//console.log('checking ',s);
				User.findOne({slug:s}, function(err, existingUser){
					if (err) { console.log('No user found for ',slug,':',err); }
					if (existingUser){
						s = '';
						while (s.length<6) {
							s+='abcdefghijkmnpqrtuvwxy346789'.charAt(Math.floor(Math.random()*28));
						}
						checkSlug(s,cb);
					} else { cb(s); }
				});
			})(user.slug, function(newSlug){
				user.slug = newSlug;
				if (cbc>1) /* waiting on other calls */ { cbc--; }
				else { done(null, user, { success:successMessage, failure:failMessage }); }
			});
			
			// Generate sk32
			crypto.randomBytes(32, function(err,buf) {
				if (err) {console.log('Unable to get random bytes:',err);}
				if (!buf) {console.log('Unable to get random buffer');}
				else {
					user.sk32 = buf.toString('hex');
					user.save(function(err) {
						if (err) {
							console.log('Error saving new user '+err);
							var failMessage = 'Something went wrong creating your account.  Would you like to <a href="/bug">report this error</a>?';
						} else { successMessage = 'Your account has been created.  Next maybe you should download the <a href="/android">android app</a>.  ' }
						if (cbc>1) /* waiting on other calls */ { cbc--; }
						else { done(null, user, { success:successMessage, failure:failMessage }); }
					});
				}
			});
		
		}
		
	});
		
}));

passport.use(new GoogleTokenStrategy({
	clientID: secret.googleClientId
}, function(parsedToken, googleId, done) {
	User.findOne({googleID:googleId}, function(err, user) {
		if (err) { 
			console.log('Error finding user for gToken login with google profile ID: '+googleId+'\n'+err); }
		if (!err && user !== null) { // Log in
			user.lastLogin = Date.now();
			user.save(function (err) {
				if (err) { 
					console.log('Error saving user\'s lastLogin for gToken login with google profile ID: '+googleId+'\n'+err); }
			});
			return done(err, user);
		} else { // No such user
			done(null, false);
		}
	});
}));
