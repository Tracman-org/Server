'use strict';
/* global mapuser userid disp noHeader mapKey */

import io from 'socket.io-client';
import $ from 'jquery';
import loadGoogleMapsAPI from 'load-google-maps-api';

// Variables
var map, view, marker, elevator, newLoc;
const mapElem = document.getElementById('map'),
	viewElem = document.getElementById('view'),
	viewImgElem = document.getElementById('viewImg'),
	socket = io('//'+window.location.hostname);

// socket.io stuff
socket
	.on('connect', function(){
		//console.log("⬆️ Connected!");
		
		// Can get location
		socket.emit('can-get', mapuser._id );

		// Can set location too
		if (mapuser._id===userid) { 
			socket.emit('can-set', userid );
		}
		
	})
	.on('disconnect', function(){
		//console.log("⬇️ Disconnected!");
	})
	.on('error', function (err){
		console.error('❌️',err.message);
	});

// Show/hide map if location is set/unset
function toggleMaps(loc) {
	if (loc.lat===0&&loc.lon===0) {
		$('#map').hide();
		$('#view').hide();
		$('#notset').show();
	}
	else {
		$('#map').show();
		$('#view').show();
		$('#notset').hide();
	}
}
// Toggle maps on page load
$(function() {
	toggleMaps(mapuser.last);
});

// Load google maps API
loadGoogleMapsAPI({ key:mapKey })
.then( function(googlemaps) {

	// Create map
	if (disp!=='1') {
		
		// Create map and marker elements
		map = new googlemaps.Map( mapElem, {
			center: new googlemaps.LatLng(
				mapuser.last.lat,
				mapuser.last.lon
			),
			// center: { 
			// 	lat: mapuser.last.lat, 
			// 	lng: mapuser.last.lon
			// },
			panControl: false,
			scaleControl: (mapuser.settings.showScale)?true:false,
			draggable: false,
			zoom: mapuser.settings.defaultZoom,
			streetViewControl: false,
			zoomControlOptions: {position: googlemaps.ControlPosition.LEFT_TOP},
			mapTypeId: (mapuser.settings.defaultMap=='road')?googlemaps.MapTypeId.ROADMAP:googlemaps.MapTypeId.HYBRID
		});
		marker = new googlemaps.Marker({
			position: { lat:mapuser.last.lat, lng:mapuser.last.lon },
			title: mapuser.name,
			icon: (mapuser.settings.marker)?'/static/img/marker/'+mapuser.settings.marker+'.png':'/static/img/marker/red.png',
			map: map,
			draggable: false
		});
		map.addListener('zoom_changed',function(){
			map.setCenter(marker.getPosition());
		});
		
		// Create iFrame logo
		if (noHeader!=='0' && mapuser._id!=='demo') {
			const logoDiv = document.createElement('div');
			logoDiv.id = 'map-logo';
			logoDiv.innerHTML = '<a href="https://tracman.org/">'+
				'<img src="https://tracman.org/static/img/style/logo-28.png" alt="[]">'+
				"<span class='text'>Tracman</span></a>";
			map.controls[googlemaps.ControlPosition.BOTTOM_LEFT].push(logoDiv);
		}
		
		// Create update time block
		const timeDiv = document.createElement('div');
		timeDiv.id = 'timestamp';
		if (mapuser.last.time) {
			timeDiv.innerHTML = 'location updated '+new Date(mapuser.last.time).toLocaleString();
		}
		map.controls[googlemaps.ControlPosition.RIGHT_BOTTOM].push(timeDiv);
		
		// Create speed block
		if (mapuser.settings.showSpeed) {
			const speedSign = document.createElement('div'),
				speedLabel = document.createElement('div'),
				speedText = document.createElement('div'),
				speedUnit = document.createElement('div');
			speedLabel.id = 'spd-label';
			speedLabel.innerHTML = 'SPEED';
			speedText.id = 'spd';
			speedText.innerHTML = (mapuser.settings.units=='standard')?(parseFloat(mapuser.last.spd)*2.23694).toFixed():mapuser.last.spd.toFixed();
			speedUnit.id = 'spd-unit';
			speedUnit.innerHTML = (mapuser.settings.units=='standard')?'m.p.h.':'k.p.h.';
			speedSign.id = 'spd-sign';
			speedSign.appendChild(speedLabel);
			speedSign.appendChild(speedText);
			speedSign.appendChild(speedUnit);
			map.controls[googlemaps.ControlPosition.TOP_RIGHT].push(speedSign);
		}
		
		// Create altitude block
		if (mapuser.settings.showAlt) {
			elevator = new googlemaps.ElevationService;
			const altitudeSign = document.createElement('div'),
				altitudeLabel = document.createElement('div'),
				altitudeText = document.createElement('div'),
				altitudeUnit = document.createElement('div');
			altitudeLabel.id = 'alt-label';
			altitudeText.id = 'alt';
			altitudeUnit.id = 'alt-unit';
			altitudeSign.id = 'alt-sign';
			altitudeText.innerHTML = '';
			altitudeLabel.innerHTML = 'ALTITUDE';
			altitudeText.innerHTML = parseAlt(mapuser.last);
			altitudeUnit.innerHTML = (mapuser.settings.units=='standard')?'feet':'meters';
			altitudeSign.appendChild(altitudeLabel);
			altitudeSign.appendChild(altitudeText);
			altitudeSign.appendChild(altitudeUnit);
			map.controls[googlemaps.ControlPosition.TOP_RIGHT].push(altitudeSign);
		}
		
	}
		
	// Create streetview
	if (disp!=='0' && mapuser.settings.showStreetview) {
		updateStreetView(parseLoc(mapuser.last),10);
	}
	
	// Parse altitude
	function parseAlt(loc){
		
		// Convert to feet if needed
		function convertUnits(meters){
			return (mapuser.settings.units=='standard')? (meters*3.28084).toFixed(): meters.toFixed();
		}
		
		// Check if altitude was provided
		if (typeof loc.alt=='number'){
			return convertUnits(loc.alt);
		}
		
		// No altitude provided
		else {

			// Query google altitude API
			elevator = elevator || new googlemaps.ElevationService;
			return elevator.getElevationForLocations({
				'locations': [{ lat:loc.lat, lng:loc.lon }]
			}, function(results, status, error_message) {
				
				// Success; return altitude
				if (status === googlemaps.ElevationStatus.OK && results[0]) {
					return convertUnits(results[0].elevation);
				} 
				
				// Unable to get any altitude
				else { 
					console.error("Failed to get altitude from API:",status);
					return "????";
				}
				
			});
		}
		
	}
	
	// Parse location
	function parseLoc(loc) {
		loc.spd = (mapuser.settings.units=='standard')?parseFloat(loc.spd)*2.23694:parseFloat(loc.spd);
		loc.dir = parseFloat(loc.dir);
		loc.lat = parseFloat(loc.lat);
		loc.lon = parseFloat(loc.lon);
		loc.alt = parseAlt(loc);
		loc.tim = new Date(loc.tim).toLocaleString();
		return loc;
	}
	
	// Got location
	socket.on('get', function(loc) {
		//console.log("🌐️ Got location:",loc.lat+", "+loc.lon);
		
		// Parse location
		newLoc = parseLoc(loc);
			
		// Update map
		if (disp!=='1') {
			
			// Update time
			$('#timestamp').text('location updated '+newLoc.tim);
			
			// Update marker and map center
			googlemaps.event.trigger(map,'resize');
			map.setCenter({ lat:newLoc.lat, lng:newLoc.lon });
			marker.setPosition({ lat:newLoc.lat, lng:newLoc.lon });
			
			// Update speed
			if (mapuser.settings.showSpeed) {
				$('#spd').text( newLoc.spd.toFixed() );
			}
				
			// Update altitude
			if (mapuser.settings.showAlt) {
				$('#alt').text( parseAlt(newLoc) );
			}
			
		}
	
		// Update street view
		if (disp!=='0' && mapuser.settings.showStreetview) {
			updateStreetView(newLoc,10);
		}
		
	});
	
	// Get street view imagery
	function getStreetViewData(loc,rad,cb) {
		// Ensure that the location hasn't changed (or this is the initial setting)
		if ( newLoc == null || loc.tim===newLoc.tim ) {
			if (!sv) { var sv=new googlemaps.StreetViewService(); }
			sv.getPanorama({
				location: {
					lat: loc.lat,
					lng: loc.lon
				},
				radius: rad
			}, function(data,status){ switch (status){
				// Success
				case googlemaps.StreetViewStatus.OK:
					cb(data);
					break;
				// No results in that radius
				case googlemaps.StreetViewStatus.ZERO_RESULTS:
					// Try again with a bigger radius
					getStreetViewData(loc,rad*2,cb);
					break;
				// Error
				default:
					console.error(new Error('❌️ Street view not available: '+status).message);
			} });
		}
	}
	
	// Update streetview
	function updateStreetView(loc) {
		
		// Calculate bearing between user and position of streetview image
		// https://stackoverflow.com/a/26609687/3006854
		function getBearing(userLoc, imageLoc) {
			return 90-(
				Math.atan2( userLoc.lat-imageLoc.latLng.lat(), userLoc.lon-imageLoc.latLng.lng() )
				* (180/Math.PI)	) % 360;
		}
		
		// Get dimensions for sv request (images proportional to element up to 640x640)
		function getDimensions(element) {
			
			// Window is smaller than max
			if ( element.width()<640 && element.height()<640 ){
				return element.width()+'x'+element.height();
			}
			
			// Width must be made proportional to 640
			else if (element.width()>element.height()) {
				return '640x'+element.height()*640/element.width();
			}
			
			// Height must be made proportional to 640
			else {
				return element.width()*640/element.height()+'x640';
			}
			
		}
		
		// Set image
		getStreetViewData(loc, 2, function(data){
			$('#viewImg').attr('src','https://maps.googleapis.com/maps/api/streetview?'+
				'size='+ getDimensions($('#view')) +
				'&location='+ data.location.latLng.lat() +','+ data.location.latLng.lng() +
				'&fov=90' + // Inclination
				// Show direction if moving, point to user if stationary
				'&heading='+ ( (loc.spd>2)? loc.dir: getBearing(loc,data.location) ).toString() +
				'&key='+ mapKey
			);
		});
		
	}

// Error loading gmaps API
}).catch( function(err) {
	console.error(err);
});
