var passport = require('passport'),
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
		User.findOne({googleID: profile.id}, function(err, user){
			if(err) { console.log(err); }
			if (!err && user !== null) { // Log in
				if (!user.name) {
					user.name = profile.displayName;
				}
				user.lastLogin = Date.now();
				user.save(function (err, raw) {
					if (err) { throwErr(req,err); }
				});
				done(null, user);
			} else { // No existing user with google auth
				if (req.session.passport) { // Creating new user
					User.findById(req.session.passport.user, function(err, user){
						if (err){ console.log(err); }
						user.googleID = profile.id;
						user.lastLogin = Date.now();
						user.save(function(err){
							if (err) { console.log(err); }
							done(null, user, {success: 'Your account has been created.  Next maybe you should download the <a href="/android">android app</a>.  '});
						});
					});
				} else { // User wasn't invited
					done(null,false, {error: 'User not found.  Maybe you want to <a href="#" data-scrollto="get">request an invite</a>?  '});
				}
			}
		});
}));

passport.use(new GoogleTokenStrategy({
		clientID: secret.googleClientId
}, function(parsedToken, googleId, done) {
	User.findOne({googleID:googleId}, function(err, user) {
		if (err) { console.log(err); }
		if (!err && user !== null) { // Log in
			user.lastLogin = Date.now();
			user.save(function (err) {
				if (err) { console.log(err); }
			});
			return done(err, user);
		} else { // No such user
			done(null, false);
		}
	});
}));