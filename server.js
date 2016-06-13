/* IMPORTS */ { var 
	express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	mongoose = require('mongoose'),
	nunjucks = require('nunjucks'),
	passport = require('passport'),
	flash = require('connect-flash'),
	secret = require('./config/secrets.js'),
	User = require('./config/models/user.js'),
	app = express(),
	http = require('http').Server(app),
	// mongo_express = require('mongo-express/lib/middleware'),
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
		app.use(session({
			secret: secret.session,
			saveUninitialized: true,
			resave: true
		}));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({
			extended: true
		}));
		app.use(cookieParser(secret.cookie));
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
		app.use('/', 
			require('./config/routes/index.js'),
			require('./config/routes/auth.js'),
			require('./config/routes/misc.js')
		);
		app.use(['/map','/trac'], require('./config/routes/map.js'));
		app.use('/invited', require('./config/routes/invite.js'));
		app.use('/admin', require('./config/routes/admin.js'));
		app.use('/static', express.static(__dirname+'/static'));
		app.use(function(req,res,next) {
			if (!res.headersSent) {
				var err = new Error('404: Not found: '+req.url);
				err.status = 404;
				next(err);
			}
		});
	}
	
	/* Error Handlers */	{
		if (secret.env=='production') {
			app.use(function(err,req,res,next) {
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error.html', {
					code: err.status
				});
			});
		} else { // Development
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
	
	// Check for tracking users
	function checkForUsers(room) {
		if (room) {
			io.to('app-'+room).emit('activate',
				(io.of("/").adapter.rooms[room])?'true':'false'
			);
		} else {
			User.find({}, function(err, users){
				if (err) { console.log('Sockets error finding all users in all rooms: '+err); }
				users.forEach( function(user){
					checkForUsers(user.id);
				});
			});
		}
	}
	
	// Websockets	
	io.on('connection', function(sock) {
		
		// Set room to map user ID
		sock.on('room', function(room) {
			sock.join(room);
			if (room.slice(0,4)!='app-'){
				// External user
				User.findById({_id:room}, function(err, user) {
					if (err) { console.log('Sockets error finding tracked user of room '+room+'\n'+err); }
					if (user) {
						io.to('app-'+room).emit('activate','true'); }
				});
			} else { // Sets location
				checkForUsers(room.slice(4));
			}
		});
		
		// Recieving beacon
		sock.on('app', function(loc){
			loc.time = Date.now();
			
			// Check for sk32 token
			if (loc.tok) {
				// Get loc.usr
				User.findById(loc.usr, function(err, user) {
					if (err) { console.log('Error finding user:',err); }
					if (!user) { console.log('User not found'); }
					else {
						// Confirm sk32 token
						if (loc.tok!=user.sk32) { console.log('loc.tok!=user.sk32 || ',loc.tok,'!=',user.sk32); }
						else {
							// Broadcast location to spectators
							io.to(loc.usr).emit('trac', loc);
							// Echo broadcast to transmittors
							io.to('app-'+loc.usr).emit('trac', loc);
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
		
		// Shutdown (check for users)
		sock.onclose = function(reason){
			var closedroom = Object.keys(
				sock.adapter.sids[sock.id]).slice(1)[0];
			setTimeout(function() {
				checkForUsers(closedroom);
			}, 3000);
			Object.getPrototypeOf(this).onclose.call(this,reason);
		};
	
	});
	
	// Listen
	http.listen(secret.port, function(){
		console.log('Listening at '+secret.url+':'+secret.port);
		checkForUsers();
	});
}

module.exports = app;