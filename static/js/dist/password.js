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
/******/ 	return __webpack_require__(__webpack_require__.s = 54);
/******/ })
/************************************************************************/
/******/ ({

/***/ 54:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* global $ Mellt */

const mellt = new Mellt();

function checkMatch(){
	$('#submit').prop('title',"You need to type your password again before you can save it. ");
	
	// They match
	if ( $('#p1').val() === $('#p2').val() ) {
		$('#submit').prop('disabled',false).prop('title',"Click here to save your password. ");
	}
	
	// User has retyped, but they don't match yet
	else if ($('#p2').val()!=='') {
		$('#password-help').text("Those passwords don't match... ").css({'color':'#fb6e3d'});
		$('#submit').prop('disabled',true).prop('title',"You need to type the same password twice before you can save it. ");
	}
	
}

// On page load
$(function(){
	
	// On typing password
	$('.password').keyup(function(){
		
		// Nothing entered
		if ( $('#p1').val()==='' && $('#p2').val()==='' ){
			$('#password-help').hide();
			$('#submit').prop('disabled',true).prop('title',"You need to enter a password first. ");
		}
		
		// Only second password entered
		else if ($('#p1').val()==='') {
			$('#password-help').show().text("Those passwords don't match... ");
			$('#submit').prop('disabled',true).prop('title',"You need to type the same password twice correctly before you can save it. ");
		}
		
		// At least first password entered
		else {
			$('#password-help').show();
			
			// Check first password
			var daysToCrack = mellt.CheckPassword($('#p1').val());
			
			// Not good enough
			if (daysToCrack<0) {
				$('#password-help').text("That's is one of the world's most commonly used passwords. You may not use it for Tracman and should not use it anywhere. ").css({'color':'#fb6e3d'});
				$('#submit').prop('disabled',true).prop('title',"You need to come up with a better password. ");
			}
			else if (daysToCrack<1) {
				$('#password-help').text("That password is pretty bad.  It could be cracked in less than a day.  Try adding more words, numbers, or symbols. ").css({'color':'#fb6e3d'});
				$('#submit').prop('disabled',true).prop('title',"You need to come up with a better password. ");
			}
			else if (daysToCrack<10) {
				$('#password-help').text("That password isn't good enough.  It could be cracked in "+daysToCrack+" day"+(daysToCrack!=1?'s':'')+".  Try adding another word, number, or symbol. ").css({'color':'#fb6e3d'});
				$('#submit').prop('disabled',true).prop('title',"You need to come up with a better password. ");
			}
			
			// Good enough
			else if (daysToCrack<=30) {
				$('#password-help').text("That password is good enough, but it could still be cracked in "+daysToCrack+" days. ").css({'color':'#eee'});
				checkMatch();
			}
			else if (daysToCrack<=365) {
				$('#password-help').text("That password is good.  It would take "+daysToCrack+" days to crack. ").css({'color':'#8ae137'});
				checkMatch();
			}
			else if (daysToCrack<1000000000) {
				var years = Math.round(daysToCrack / 365 * 10) / 10;
				if (years>1000000) {
					years = (Math.round(years/1000000*10)/10)+' million';
				}
				if (years>1000) {
					years = (Math.round(years/1000))+' thousand';
				}
				$('#password-help').text("That password is great!  It could take up to "+years+" years to crack!").css({'color':'#8ae137'});
				checkMatch();
			}
			else {
				$('#password-help').text("That password is amazing!  It is virtually impossible to crack!").css({'color':'#8ae137'});
				checkMatch();
			}
		}
		
	});
	
	// On checking 'show'
	$('#show').click(function(){
		if ($(this).is(':checked')) {
			$('.password').attr('type','text');
		} else {
			$('.password').attr('type','password');
		}
	});
	
});


/***/ })

/******/ });