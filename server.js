'use strict';

/* IMPORTS */
const
	express = require('express'),
	bodyParser = require('body-parser'),
	expressValidator = require('express-validator'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	winston = require('winston'),
	mongoose = require('mongoose'),
	nunjucks = require('nunjucks'),
	passport = require('passport'),
	flash = require('connect-flash-plus'),
	env = require('./config/env/env.js'),
	User = require('./config/models.js').user,
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	sockets = require('./config/sockets.js');


/* SETUP */ {
	
	// Log level
	winston.level = env.logLevel || 'info';

	/* Database */ {
		
		// Setup with native ES6 promises
		mongoose.Promise = global.Promise;
		
    // Connect to database
		mongoose.connect(env.mongoSetup, {
			server:{socketOptions:{
				keepAlive:1, connectTimeoutMS:30000 }},
			replset:{socketOptions:{
				keepAlive:1, connectTimeoutMS:30000 }}
		})
		.then( ()=>{ console.log(`💿 Mongoose connected to mongoDB`); })
		.catch( (err)=>{ console.error(`❌ ${err.stack}`); });
		
	}

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
		app.use(expressValidator());
		app.use(flash());
	}
	
	/* Auth */ {
		require('./config/passport.js')(passport);
		app.use(passport.initialize());
		app.use(passport.session());
	}
	
	/* Routes	*/ {
		
		// Static files (keep this before setting default locals)
		app.use('/static', express.static( __dirname+'/static', {dotfiles:'allow'} ));
		
		// Set default locals available to all views (keep this after static files)
		app.get( '*', (req,res,next)=>{
			
			// Path for redirects
			let nextPath = ((req.query.next)?req.query.next: req.path.substring(0,req.path.indexOf('#')) || req.path );
			if ( nextPath.substring(0,6)!=='/login' && nextPath.substring(0,7)!=='/logout' ){
				req.session.next = nextPath+'#';
				winston.debug(`Set redirect path to ${nextPath}#`);
			}
			
			// User account
			res.locals.user = req.user;
			
			// Flash messages
			res.locals.successes = req.flash('success');
			res.locals.dangers = req.flash('danger');
			res.locals.warnings = req.flash('warning');
			
			next();
		} );
		
		// Auth routes
		require('./config/routes/auth.js')(app, passport);
		
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
		app.use( (req,res,next)=>{
			if (!res.headersSent) {
				var err = new Error(`Not found: ${req.url}`);
				err.status = 404;
				next(err);
			}
		} );

		// Production handlers
		if (env.mode!=='development') {
			app.use( (err,req,res,next)=>{
				if (err.status!==404){ console.error(`❌ ${err.stack}`); }
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error', {
					code: err.status||500,
					message: (err.status<=499)?err.message:"Server error"
				});
			} );
		}
		
		// Development handlers
		else {
			app.use( (err,req,res,next)=>{
				if (err.status!==404) { console.error(`❌ ${err.stack}`); }
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error', {
					code: err.status||500,
					message: err.message,
					stack: err.stack
				});
			} );
		}
		
	}
	
	/* Sockets */ {
		sockets.init(io);
	}
	
}

/* RUNTIME */ {
	console.log('🖥  Starting Tracman server...');
	
	// Listen
	http.listen( env.port, ()=>{
		console.log(`🌐 Listening in ${env.mode} mode on port ${env.port}... `);
		winston.verbose(`Log level set to ${env.logLevel}`);
		
		// Check for clients for each user
		User.find({})
		.then( (users)=>{
			users.forEach( (user)=>{
				sockets.checkForUsers( io, user.id );
			});
		})
		.catch( (err)=>{
			console.error(`❌ ${err.stack}`);
		});
		
	});
	
}

module.exports = app;
