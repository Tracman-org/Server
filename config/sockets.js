const debug = require('debug')('tracman-sockets')
const User = require('./models.js').user

// Check for tracking clients
function checkForUsers(io, user) {
	debug(`Checking for clients receiving updates for ${user}`);
	
	// Checks if any sockets are getting updates for this user
	if (Object.values(io.sockets.connected).some( (socket)=>{
		return socket.gets===user;
	})) {
		debug(`Activating updates for ${user}.`);
		io.to(user).emit('activate','true');
	} else {
		debug(`Deactivating updates for ${user}.`);
		io.to(user).emit('activate', 'false');
	}
}

module.exports = {
	
	checkForUsers: checkForUsers,
	
	init: (io) => {
		debug(`Initiating socketio...`)		

		io.on('connection', (socket)=>{
			debug(`${socket.id} connected.`)
			
			// Set a few variables
			socket.ip = socket.client.request.headers['x-real-ip']
			socket.ua = socket.client.request.headers['user-agent']
			
			// Log and errors
			//socket.on('log', (text)=>{
			//	console.log(`log: ${text}`)
			//})
			socket.on('error', (err) => { console.error('❌', err.stack); } )
			
			// This socket can set location (app)
			socket.on('can-set', (userId) => {
				debug(`${socket.id} can set updates for ${userId}.`);
				socket.join(userId, ()=>{
					debug(`${socket.id} joined ${userId}`);
				});
				checkForUsers( io, userId );
			});
			
			// This socket can receive location (map)
			socket.on('can-get', (userId) => {
				debug(`${socket.id} can get updates for ${userId}.`)
				socket.gets = userId
				socket.join(userId, () => {
					debug(`${socket.id} joined ${userId}`)
					socket.to(userId).emit('activate', 'true')
				})
			})
			
			// Set location
			socket.on('set', (loc) => {
				debug(`${socket.id} set location for ${loc.usr} to: ${JSON.stringify(loc)}`)
				
				// Get android timestamp or use server timestamp
				if (loc.ts){ 
					debug(`Using android timestamp of ${loc.ts} for loc`)
					loc.tim = Date(loc.ts)
				} else {
					debug(`Using server time of ${Date.now()} for loc`)
					loc.tim = Date.now()
				}

				// Check for user and sk32 token
				if (!loc.usr){
					console.error("❌", new Error(`Recieved an update from ${socket.ip} without a usr!`).message)
				}
				else if (!loc.tok){
					console.error("❌", new Error(`Recieved an update from ${socket.ip} for usr ${loc.usr} without an sk32!`).message)
				}
				else {
					
					// Get loc.usr
					debug(`Getting loc.user of ${loc.user}`)
					User.findById(loc.usr)
					.where('sk32').equals(loc.tok)
					.then( (user)=>{
						if (!user){
							console.error("❌", new Error(`Recieved an update from ${socket.ip} for ${loc.usr} with tok of ${loc.tok}, but no such user was found in the db!`).message)
						}
						else {
							
							// Broadcast location
							debug(`Broadcasting ${loc.lat}, ${loc.lon} to ${loc.usr}`)
							io.to(loc.usr).emit('get', loc)
							
							// Save in db as last seen
							debug(`Saving user.last for user ${user.id}`)
							user.last = {
								lat: parseFloat(loc.lat),
								lon: parseFloat(loc.lon),
								dir: parseFloat(loc.dir||0),
								spd: parseFloat(loc.spd||0),
								time: loc.tim
							}
							user.save()
							.then( () => {
								debug(`user.last with time of ${loc.tim} successfully saved for user ${user.id}`)
							})
							.catch( (err) => {
								debug(`Failed to save user.last for user ${user.id}`)
								console.error("❌", err.stack)
							})

						}
					})
					.catch( (err) => {
						debug(`Error finding user with id of ${loc.usr}`)
						console.error("❌", err.stack)
					})
				
				}
			})
			
			// Shutdown (check for remaining clients)
			socket.on('disconnect', (reason) => {
				debug(`${socket.id} disconnected because of a ${reason}.`)
				
				// Check if client was receiving updates
				if (socket.gets) {
					debug(`${socket.id} left ${socket.gets}`)
					checkForUsers( io, socket.gets )
				}
				
			})
			
		})
		
	}
	
}
