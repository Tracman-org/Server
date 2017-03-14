/* IMPORTS */ { var 
	express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	mongoose = require('mongoose'),
	nunjucks = require('nunjucks'),
	passport = require('passport'),
	flash = require('connect-flash'),
	secret = require('./config/secrets.js'),
	User = require('./config/models/user.js'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http);
}

/* SETUP */ {
	/* Database */ mongoose.connect(secret.mongoSetup, {
		server:{socketOptions:{
			keepAlive:1, connectTimeoutMS:30000 }},
		replset:{socketOptions:{
			keepAlive:1, connectTimeoutMS:30000 }}
	});
	
	/* Templates */ nunjucks.configure(__dirname+'/views', {
		autoescape: true,
		express: app
	});
	
	/* Session */ {
		app.use(cookieParser(secret.cookie));
		// app.use(expressSession({
		app.use(cookieSession({
			cookie: {maxAge:60000},
			secret: secret.session,
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
		app.use(passport.initialize());
		app.use(passport.session());
		require('./config/auth.js');
		passport.serializeUser(function(user,done) {
			done(null, user.id);
		});
		passport.deserializeUser(function(id,done) {
			User.findById(id, function(err, user) {
				if(!err) done(null, user);
				else done(err, null);
			});
		});
	}
	
	/* Routes	*/ {
		app.get('/favicon.ico', function(req,res){
			res.redirect('/static/img/icon/by/16-32-48.ico');
		});
		app.use('/', 
			require('./config/routes/index.js'),
			require('./config/routes/auth.js'),
			require('./config/routes/misc.js')
		);
		app.use(['/map','/trac'], require('./config/routes/map.js'));
		app.use('/admin', require('./config/routes/admin.js'));
		app.use('/static', express.static(__dirname+'/static'));
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
		if (secret.env=='production') {
			app.use(function(err,req,res,next) {
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error.html', {
					code: err.status
				});
			});
		}
		else /* Development */{
			app.use(function(err,req,res,next) {
				console.log(err);
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error.html', {
					code: err.status,
					message: err.message,
					error: err
				});
			});
		}
	}
	
}

/* RUNTIME */ {
	
	// Check for tracking clients
	function checkForUsers(user) {
		console.log(`Checking for clients receiving updates for ${user}`);
		
		// Checks if any sockets are getting updates for this user
		//TODO: Use Object.values() after upgrading to node v7
		if (Object.keys(io.sockets.connected).map( function(id){
			return io.sockets.connected[id];
		}).some( function(socket){
			return socket.gets==user;
		})) {
			console.log(`Activating updates for ${user}.`);
			io.to(user).emit('activate','true');
		} else {
			console.log(`Deactivating updates for ${user}.`);
			io.to(user).emit('activate', 'false');
		}
		
	}
	
	// Sockets	
	io.on('connection', function(socket) {
		console.log(`${socket.id} connected.`);
		
		// This socket can set location (app)
		socket.on('can-set', function(userId){
			console.log(`${socket.id} can set updates for ${userId}.`);
			socket.join(userId, function(){
				console.log(`${socket.id} joined ${userId}`);
			});
			checkForUsers(userId);
		});
		
		// This socket can receive location (map)
		socket.on('can-get', function(userId){
			socket.gets = userId;
			console.log(`${socket.id} can get updates for ${userId}.`);
			socket.join(userId, function(){
				console.log(`${socket.id} joined ${userId}`);
				socket.to(userId).emit('activate', 'true');
			});
		});
		
		// Set location
		socket.on('set', function(loc){
			// console.log(`${socket.id} set location for ${loc.usr}`);
			loc.time = Date.now();
			
			// Check for sk32 token
			if (!loc.tok) { console.log('!loc.tok for loc:',loc) }
			else {
				
				// Get loc.usr
				User.findById(loc.usr, function(err, user) {
					if (err) { console.log('Error finding user:',err); }
					if (!user) { console.log('User not found for loc:',loc); }
					else {
						
						// Confirm sk32 token
						if (loc.tok!=user.sk32) { console.log('loc.tok!=user.sk32 || ',loc.tok,'!=',user.sk32); }
						else {
							
							// Broadcast location
							io.to(loc.usr).emit('get', loc);
							// console.log(`Broadcasting ${loc.lat}, ${loc.lon} to ${loc.usr}`);
							// Save in db as last seen
							user.last = {
								lat: parseFloat(loc.lat),
								lon: parseFloat(loc.lon),
								dir: parseFloat(loc.dir||0),
								spd: parseFloat(loc.spd||0),
								time: loc.time
							};
							user.save(function(err) {
								if (err) { console.log('Error saving user last location:'+loc.user+'\n'+err); }
							});
							
						}
					}
				});
			}
		});
		
		// Shutdown (check for remaining clients)
		socket.on('disconnect', function(reason){
			console.log(`${socket.id} disconnected because of a ${reason}.`);
			
			// Check if client was receiving updates
			if (socket.gets){
				console.log(`${socket.id} left ${socket.gets}`);
				checkForUsers(socket.gets);
			}
			
		});
		
		// Log errors
		socket.on('error', function(err){
			console.log('Socket error! ',err);
		});
		
	});
	
	// Listen
	http.listen(secret.port, function(){
		console.log(
			'==========================================\n'+
			'Listening at '+secret.url+
			'\n=========================================='
		);
		
		// Check for clients for each user
		User.find({}, function(err, users){
			if (err) { console.log(`DB error finding all users: ${err.message}`); }
			users.forEach( function(user){
				checkForUsers(user.id);
			});
		});
		
	});
}

module.exports = app;
