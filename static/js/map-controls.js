'use strict';
/* global navigator $ socket userid token mapuser toggleMaps */

var wpid, newloc;

// Set location
function setLocation() {
	if (!userid==mapuser._id) {alert('You are not logged in! ');}
	else {
		if (!navigator.geolocation) {alert('Geolocation not enabled. ');}
		else {
			navigator.geolocation.getCurrentPosition(function(pos){
				var newloc = {
					tok: token,
					usr: userid,
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
					spd: (pos.coords.speed||0)
				};
				socket.emit('set', newloc);
				toggleMaps(newloc);
				console.log('⚜ Set location:',newloc.lat+", "+newloc.lon);
			}, function(err) {
				alert("Unable to set location.");
				console.error('⛔️',err.message);
			}, { enableHighAccuracy:true });
		}
	}
}

// Track location
function trackLocation() {
	if (!userid==mapuser._id) { alert('You are not logged in! '); }
	else {
		// Stop tracking
		if (wpid) {
			$('#controls > .track').html('<i class="fa fa-crosshairs"></i>&emsp;Track').tooltip('hide');
			navigator.geolocation.clearWatch(wpid);
			wpid = undefined;
		// Start tracking
		} else {
			$('#controls > .track').html('<i class="fa fa-crosshairs fa-spin"></i>&emsp;Stop').tooltip('show');
			if (!navigator.geolocation) { alert('Unable to track location. '); }
			else {
				wpid = navigator.geolocation.watchPosition(function(pos) {
					newloc = {
						tok: token,
						usr: '{{user.id}}',
						lat: pos.coords.latitude,
						lon: pos.coords.longitude,
						spd: (pos.coords.speed||0)
					};
					socket.emit('set',newloc);
					toggleMaps(newloc);
					console.log('⚜ Set location:',newloc.lat+", "+newloc.lon);
				}, function(err){
					alert("Unable to track location.");
					console.error(err.message);
				}, { enableHighAccuracy:true });
			}
		}
		}
}

// Clear location
function clearLocation() {
	if (!userid==mapuser._id) { alert('You are not logged in! '); }
	else {
		// Stop tracking
		if (wpid) {
			$('#controls > .track').html('<i class="fa fa-crosshairs"></i>&emsp;Track').tooltip('hide');
			navigator.geolocation.clearWatch(wpid);
			wpid = undefined;
		} 
		newloc = {
			tok: token,
			usr: userid,
			lat:0, lon:0, spd:0
		};
		socket.emit('set',newloc);
		toggleMaps(newloc);
		console.log('⚜ Cleared location');
	}
}
