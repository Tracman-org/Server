/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 53);
/******/ })
/************************************************************************/
/******/ ({

/***/ 53:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* global navigator $ socket userid token mapuser toggleMaps */

$(function(){
	var wpid, newloc;
	
	// Set location
	$('#set-loc').click(function(){
		if (!userid===mapuser._id){ alert('You are not logged in! '); }
		else { if (!navigator.geolocation){ alert('Geolocation not enabled. '); }
		
		else { navigator.geolocation.getCurrentPosition(
				
			// Success callback
			function(pos){
				var newloc = {
					ts: Date.now(),
					tok: token,
					usr: userid,
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
					spd: (pos.coords.speed||0)
				};
				socket.emit('set', newloc);
				toggleMaps(newloc);
				console.log('⚜ Set location:',newloc.lat+", "+newloc.lon);
			},
			
			// Error callback
			function(err) {
				alert("Unable to set location.");
				console.error('❌️',err.message);
			},
			
			// Options
			{ enableHighAccuracy:true }
		
		); } }
		
	});
	
	// Track location
	$('#track-loc').click(function(){
		if (!userid===mapuser._id) { alert('You are not logged in! '); }
		else {
			
			// Start tracking
			if (!wpid) {
				if (!navigator.geolocation) { alert('Unable to track location. '); }
				else {
					$('#track-loc').html('<i class="fa fa-crosshairs fa-spin"></i>Stop').prop('title',"Click here to stop tracking your location. ");
					wpid = navigator.geolocation.watchPosition(
					
						// Success callback
						function(pos) {
							newloc = {
								ts: Date.now(),
								tok: token,
								usr: userid,
								lat: pos.coords.latitude,
								lon: pos.coords.longitude,
								spd: (pos.coords.speed||0)
							}; socket.emit('set',newloc);
							toggleMaps(newloc);
							console.log('⚜ Set location:',newloc.lat+", "+newloc.lon);
						},
						
						// Error callback
						function(err){
							alert("Unable to track location.");
							console.error(err.message);
						},
						
						// Options
						{ enableHighAccuracy:true }
						
					);
				}
				
			}
			
			// Stop tracking
			else {
				$('#track-loc').html('<i class="fa fa-crosshairs"></i>Track').prop('title',"Click here to track your location. ");
				navigator.geolocation.clearWatch(wpid);
				wpid = undefined;
			}
			

			
		}
	});
	
	// Clear location
	$('#clear-loc').click(function(){
		if (!userid===mapuser._id) { alert('You are not logged in! '); }
		else {
			// Stop tracking
			if (wpid) {
				$('#track-loc').html('<i class="fa fa-crosshairs"></i>Track');
				navigator.geolocation.clearWatch(wpid);
				wpid = undefined;
			}
			
			// Clear location
			newloc = {
				ts: Date.now(),
				tok: token,
				usr: userid,
				lat:0, lon:0, spd:0
			}; socket.emit('set',newloc);
			
			// Turn off map
			toggleMaps(newloc);
			console.log('⚜ Cleared location');
		}
	});

});

/***/ })

/******/ });