'use strict';

// Imports
const fs = require('fs'), 
	debug = require('debug')('tracman-demo');

module.exports = (io)=>{
	
	// File is space-seperated: delay, lat, lon, dir, spd
	fs.readFile(__dirname+'/demo.txt', (err,data)=>{
		if (err){ console.error(`❌ ${err.stack}`); }
		
		const lines = data.toString().split('\n');
		
		(function sendLoc(ln) {
			if (ln>20754){ sendLoc(0) }
			else {
				
				let loc = lines[ln].split(' ');
				debug(`Sending demo location: ${loc[1]}, ${loc[2]}`);
				io.to('demo').emit('get', {
					tim: new Date(),
					lat: loc[1],
					lon: loc[2],
					dir: loc[3],
					spd: loc[4]
				});
				
				// Repeat after delay in milliseconds
				setTimeout(()=>{
					sendLoc(ln+1); // next line of file
				}, loc[0]);
				
			}
		})(5667);
		
	});
};