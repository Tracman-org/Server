// Imports
const fs = require('fs')
const debug = require('debug')('tracman-demo')

module.exports = (io)=>{
	
	// File is space-seperated: delay, lat, lon, dir, spd
	fs.readFile(__dirname+'/demo.txt', (err,data)=>{
		if (err){ console.error(`Error reading file from ${__dirname+'demo.txt'}:\n${err.stack}`); }
		
		const lines = data.toString().split('\n')
		debug(`Found ${lines.length} lines in ${__dirname+'demo.txt'}`);
		
		(function sendLoc(ln) {
			debug(`sendLoc(${ln}) called`)
			if (ln>20754){ sendLoc(0); } // Reached end of list, restart
			else {
				
				let loc = lines[ln].split(' ')
				debug(`Sending demo location: ${loc[1]}, ${loc[2]}`)
				io.to('demo').emit('get', {
					tim: new Date(),
					lat: loc[1],
					lon: loc[2],
					dir: loc[3],
					spd: loc[4]
				});
				
				// Repeat for next location
				setTimeout(()=>{
					sendLoc(ln+1); // next line of file
				}, loc[0]); // Number of miliseconds delay
				
			}
		})(5667); // Initiate
		
	});
};
