var passport = require('passport'),
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
		User.findOne({googleID: profile.id}, function(err, user){
			if(err) { console.log('Error finding user with google ID: '+profile.id+'\n'+err); }
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
					User.findById(req.session.passport.user, function(err,user){
						if (err) {
							console.log('Error finding invited user with passport session ID: '+req.session.passport.user+'\n'+err);
							var failMessage = 'Something went wrong finding your session.  Would you like to <a href="/bug">report this error</a>?'; }
						else {
							user.googleID = profile.id;
							user.lastLogin = Date.now();
							crypto.randomBytes(32, function(err,buf) {
								if (err) {console.log('Unable to get random bytes:',err);}
								if (!buf) {console.log('Unable to get random buffer');}
								else {
									user.sk32 = buf.toString('hex');
									user.save(function(err) {
										if (err) {
											console.log('Error saving new (invited) user '+err);
											var failMessage = 'Something went wrong finding your session.  Would you like to <a href="/bug">report this error</a>?';
										} else { successMessage = 'Your account has been created.  Next maybe you should download the <a href="/android">android app</a>.  ' }
										done(null, user, { success:successMessage, failure:failMessage });
									});
								}
							});
						}
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
