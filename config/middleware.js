secret = require('./secrets.js');

module.exports = {

	throwErr: function(req,err){
		console.log('Middleware error:'+err+'\nfor request:\n'+req);
		if (secret.env==='production') {
			req.flash('error', 'An error occured. <br>Would you like to <a href="/bug">report it</a>?');
			req.flash('error-message',err);
		} else {
			req.flash('error',err);
			req.flash('error-message',err);
		}
	},
	
	ensureAuth: function(req,res,next){
		if (req.isAuthenticated()) { return next(); }
		else {
			req.session.returnTo = req.path;
			console.log('mw.ensureAuth: Going to redirect to '+req.path+' after login.'); // TODO: Correct next path
			req.flash('error', 'You must be signed in to do that.  <a href="/login">Click here to log in</a>.  ');
			res.redirect('/');
		}
	},
	
	ensureAdmin: function(req,res,next){
		if (req.user.isAdmin) { return next(); }
		else { res.sendStatus(401); }
	}
	
};