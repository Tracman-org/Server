'use strict';

// Imports
const winston = require('winston'),
	User = require('./models.js').user;

// Check for tracking clients
function checkForUsers(io, user) {
	winston.silly(`Checking for clients receiving updates for ${user}`);
	
	// Checks if any sockets are getting updates for this user
	if (Object.values(io.sockets.connected).some( (socket)=>{
		return socket.gets===user;
	})) {
		winston.silly(`Activating updates for ${user}.`);
		io.to(user).emit('activate','true');
	} else {
		winston.silly(`Deactivating updates for ${user}.`);
		io.to(user).emit('activate', 'false');
	}
}

module.exports = {
	
	checkForUsers: checkForUsers,
	
	init: (io)=>{
		io.on('connection', (socket)=>{
			winston.silly(`${socket.id} connected.`);
			
			// Set a few variables
			//socket.ip = socket.client.request.headers['x-real-ip'];
			//socket.ua = socket.client.request.headers['user-agent'];
			
			/* Log */
			socket.on('log', (text)=>{
				winston.debug(`LOG: ${text}`);
			});
			
			// This socket can set location (app)
			socket.on('can-set', (userId)=>{
				winston.silly(`${socket.id} can set updates for ${userId}.`);
				socket.join(userId, ()=>{
					winston.silly(`${socket.id} joined ${userId}`);
				});
				checkForUsers( io, userId );
			});
			
			// This socket can receive location (map)
			socket.on('can-get', (userId)=>{
				socket.gets = userId;
				winston.silly(`${socket.id} can get updates for ${userId}.`);
				socket.join(userId, ()=>{
					winston.debug(`${socket.id} joined ${userId}`);
					socket.to(userId).emit('activate', 'true');
				});
			});
			
			// Set location
			socket.on('set', (loc)=>{
				winston.debug(`${socket.id} set location for ${loc.usr}`);
				winston.silly(`Location was set to: ${JSON.stringify(loc)}`);
				
				// Get android timestamp or use server timestamp
				if (loc.ts){ loc.tim = Date(loc.ts); }
				else { loc.tim = Date.now(); }

				// Check for user and sk32 token
				if (!loc.usr){
					console.error("❌", new Error(`Recieved an update from ${socket.ip} without a usr!`).message);
				}
				else if (!loc.tok){
					console.error("❌", new Error(`Recieved an update from ${socket.ip} for usr ${loc.usr} without an sk32!`).message);
				}
				else {
					
					// Get loc.usr
					User.findById(loc.usr)
					.where('sk32').equals(loc.tok)
					.then( (user)=>{
						if (!user){
							console.error("❌", new Error(`Recieved an update from ${socket.ip} for ${loc.usr} with tok of ${loc.tok}, but no such user was found in the db!`).message);
						}
						else {
							
							// Broadcast location
							io.to(loc.usr).emit('get', loc);
							winston.debug(`Broadcasting ${loc.lat}, ${loc.lon} to ${loc.usr}`);
							
							// Save in db as last seen
							user.last = {
								lat: parseFloat(loc.lat),
								lon: parseFloat(loc.lon),
								dir: parseFloat(loc.dir||0),
								spd: parseFloat(loc.spd||0),
								time: loc.tim
							};
							user.save()
							.catch( (err)=>{ console.error("❌", err.stack); });
								
						}
					})
					.catch( (err)=>{ console.error("❌", err.stack); });
				
				}
			});
			
			// Shutdown (check for remaining clients)
			socket.on('disconnect', (reason)=>{
				winston.silly(`${socket.id} disconnected because of a ${reason}.`);
				
				// Check if client was receiving updates
				if (socket.gets){
					winston.silly(`${socket.id} left ${socket.gets}`);
					checkForUsers( io, socket.gets );
				}
				
			});
			
			// Log errors
			socket.on('error', (err)=>{ console.error('❌', err.stack); });
			
		});
	}
	
};