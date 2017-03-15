'use strict';

// Imports
const User = require('./models/user.js');

// Check for tracking clients
function checkForUsers(io, user) {
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

module.exports = {
	
	checkForUsers: checkForUsers,
	
	init: function(io){
		io.on('connection', function(socket) {
			console.log(`${socket.id} connected.`);
			
			// This socket can set location (app)
			socket.on('can-set', function(userId){
				console.log(`${socket.id} can set updates for ${userId}.`);
				socket.join(userId, function(){
					console.log(`${socket.id} joined ${userId}`);
				});
				checkForUsers( io, userId );
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
				//console.log(`${socket.id} set location for ${loc.usr}`);
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
								//console.log(`Broadcasting ${loc.lat}, ${loc.lon} to ${loc.usr}`);
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
					checkForUsers( io, socket.gets );
				}
				
			});
			
			// Log errors
			socket.on('error', function(err){
				console.log('Socket error! ',err);
			});
			
		});
	}
	
};