'use strict';

const env = require('./env.js');

module.exports = {

	// Throw error
	throwErr: function(req,err){
		console.error('middleware.js:5 '+typeof err);
		console.error('Middleware error:'+err+'\nfor request:\n'+req);
		if (env.mode==='production') {
			req.flash('danger', 'An error occured. <br>Would you like to <a href="https://github.com/Tracman-org/Server/issues/new">report it</a>?');
		} else { // development
			req.flash('danger', err);
		}
	},
	
	// Capitalize the first letter of a string
	capitalize: function(str){ 'use strict';
		return str.charAt(0).toUpperCase() + str.slice(1);
	},
	
	// Ensure authentication
	ensureAuth: function(req,res,next){
		if (req.isAuthenticated()) { return next(); }
		else { res.redirect('/login'); }
	},
	
	// Ensure administrator
	ensureAdmin: function(req,res,next){
		if (req.user.isAdmin){ return next(); }
		else { res.sendStatus(401); }
		//TODO: test this by logging in as !isAdmin and go to /admin
	}

};