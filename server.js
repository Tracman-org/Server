'use strict';

/* IMPORTS */ 
const 
	express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	mongoose = require('mongoose'),
	nunjucks = require('nunjucks'),
	passport = require('passport'),
	flash = require('connect-flash'),
	env = require('./config/env.js'),
	User = require('./config/models.js').user,
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	sockets = require('./config/sockets.js');


/* SETUP */ {
	
	/* Database */ mongoose.connect(env.mongoSetup, {
		server:{socketOptions:{
			keepAlive:1, connectTimeoutMS:30000 }},
		replset:{socketOptions:{
			keepAlive:1, connectTimeoutMS:30000 }}
	});
	
	/* Templates */ {
		nunjucks.configure(__dirname+'/views', {
			autoescape: true,
			express: app
		});
		app.set('view engine','html');
	}
	
	/* Session */ {
		app.use(cookieParser(env.cookie));
		app.use(cookieSession({
			cookie: {maxAge:60000},
			secret: env.session,
			saveUninitialized: true,
			resave: true
		}));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({
			extended: true
		}));
		app.use(flash());
	}
	
	/* Auth */ {
		require('./config/passport.js')(passport);
		app.use(passport.initialize());
		app.use(passport.session());
		require('./config/auth.js')(app, passport);
		// app.use(passport.initialize());
		// app.use(passport.session());
		// require('./config/auth.js');
		// passport.serializeUser(function(user,done) {
		// 	done(null, user.id);
		// });
		// passport.deserializeUser(function(id,done) {
		// 	User.findById(id, function(err, user) {
		// 		if(!err) done(null, user);
		// 		else done(err, null);
		// 	});
		// });
	}
	
	/* Routes	*/ {
		
		// Static files (keep this before setting default locals)
		app.use('/static', express.static(__dirname+'/static'));
		
		// Set default locals (keep this after static files)
		app.get('/*', function(req,res,next){
			// console.log(`Setting local variables for request to ${req.path}.`);
				
			// User account
			// res.locals.user = req.user;
			// console.log(`User set as ${res.locals.user}. `);
			
			// Flash messages
			res.locals.successes = req.flash('success');
			res.locals.dangers = req.flash('danger');
			res.locals.warnings = req.flash('warning');
			// console.log(`Flash messages set as:\nSuccesses: ${res.locals.successes}\nWarnings: ${res.locals.warnings}\nDangers: ${res.locals.dangers}`);
			
			next();
		});
		
		// Main routes
		app.use( '/', require('./config/routes/index.js') );
		
		// Settings
		app.use( '/settings', require('./config/routes/settings.js') );
		
		// Map
		app.use( ['/map','/trac'], require('./config/routes/map.js') );
		
		// Site administration
		app.use( '/admin', require('./config/routes/admin.js') );
		
		// Testing
		if (env.mode == 'development') {
			app.use( '/test', require('./config/routes/test.js' ) );
		}
		
	}
	
	/* Errors */	{
		// Catch-all for 404s
		app.use(function(req,res,next) {
			if (!res.headersSent) {
				var err = new Error('404: Not found: '+req.url);
				err.status = 404;
				next(err);
			}
		});
		
		// Handlers
		if (env.mode=='production') {
			app.use(function(err,req,res,next) {
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error', {
					code: err.status
				});
			});
		}
		else /* Development */{
			app.use(function(err,req,res,next) {
				console.log(err);
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error', {
					code: err.status,
					message: err.message,
					error: err
				});
			});
		}
	}
	
	/* Sockets */ {
		sockets.init(io);
	}
	
}

/* RUNTIME */ {
	
	// Listen
	http.listen(env.port, function(){
		console.log(
			'==========================================\n'+
			'Listening at '+env.url+
			'\n=========================================='
		);
		
		// Check for clients for each user
		User.find({}, function(err, users){
			if (err) { console.log(`DB error finding all users: ${err.message}`); }
			users.forEach( function(user){
				sockets.checkForUsers( io, user.id );
			});
		});
		
	});
	
}

module.exports = app;
