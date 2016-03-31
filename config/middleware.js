module.exports = {

	throwErr: function(req,err){
		console.log(err);
		req.flash('error-message',err);
		req.flash('error', (err.message||'')+'<br>Would you like to <a href="/bug">report this error</a>?');
	},
	
	ensureAuth: function(req,res,next){
		if (req.isAuthenticated()) { return next(); }
		else {
			req.session.returnTo = req.path;
			req.flash('error', 'You must be signed in to do that.  <a href="/login">Click here to log in</a>.  ');
			res.redirect('/');
		}
	},
	
	ensureAdmin: function(req,res,next){
		if (req.user.isAdmin) { return next(); }
		else { res.sendStatus(401); }
	}
	
};