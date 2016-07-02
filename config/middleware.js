var secret = require('./secrets.js');

var throwErr = function(req,err){
	console.log('middleware.js:5 '+typeof err);
	console.log('Middleware error:'+err+'\nfor request:\n'+req);
	if (secret.env==='production') {
		req.flash('error', 'An error occured. <br>Would you like to <a href="/bug">report it</a>?');
		req.flash('error-message',err);
	} else { // development
		req.flash('error',err);
		req.flash('error-message',err);
	}
};

var ensureAuth = function(req,res,next){
	if (req.isAuthenticated()) { return next(); }
	else { res.redirect('/login'); }
};

var ensureAdmin = function(req,res,next){
	ensureAuth(req,res,function(){
		if (req.user.isAdmin){ return next(); }
		else { next(); }
		//TODO: test this by logging in as !isAdmin and go to /admin
		// else if (!res.headersSent) { // 404 to users (not admin)
		// 	var err = new Error('404: Not found: '+req.url);
		// 	err.status = 404;
		// 	res.render('error.html', {
		// 		code: err.status
		// 	});
		// }
	});
};

module.exports = {
	throwErr,
	ensureAuth,
	ensureAdmin	
};