'use strict';

const secret = require('./secrets.js');

var throwErr = function(req,err){
	console.error('middleware.js:5 '+typeof err);
	console.error('Middleware error:'+err+'\nfor request:\n'+req);
	if (secret.env==='production') {
		req.flash('danger', 'An error occured. <br>Would you like to <a href="https://github.com/Tracman-org/Server/issues/new">report it</a>?');
	} else { // development
		req.flash('danger', err);
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