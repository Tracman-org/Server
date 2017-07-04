'use strict';
/* global $ */

import css from '../css/contact.css';

var validEmail, validMessage;

// Validate email addresses
function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

// Validate form
function validateForm(input) {
	
	// Check if email is valid
	if (input==='email') {
		if (!validateEmail($('#email-input').val())) {
			validEmail = false;
			$('#email-help').show();
			$('#submit-button').prop('disabled',true).prop('title',"You need to enter a valid email address. ");
		}
		else {
			validEmail = true;
			$('#email-help').hide();
			validateForm();
		}
	}
	
	// Ensure message has been entered
	if (input==='message') {
		if ($('#message-input').val()==='') {
			validMessage = false;
			$('#message-help').show();
			$('#submit-button').prop('disabled',true).prop('title',"You need to enter a message. ");
		}
		else {
			validMessage = true;
			$('#message-help').hide();
			validateForm();
		}
	}
	
	// Recheck whole form
	else {
		if (validEmail && validMessage) {
			$('#submit-button').prop('disabled',false).prop('title',"Click here to send your message. ");
			return true;
		}
		else {
			$('#submit-button').prop('disabled',true).prop('title',"Edit the form before clicking send. ");
			return false;
		}
	}
	
}

// Initial check
$(function() {
	
	if ( validateEmail($('#email-input').val()) ) { validEmail = true; }
	else { validEmail = false; }
	
	if ( !$('#message-input').val()==='' ) { validMessage = true;	}
	else { validMessage = false; }
	
	// Use a one-second timout because reCaptcha re-enables the button by default
	setTimeout(validateForm,1000);
		
});

// Submit form (reCaptcha callback)
window.onSubmit = function() {
	if (validateForm()) { $('#contact-form').submit(); }
};

// Form change listener
$('#email-input').change(function(){
	validateForm('email');
});
$('#message-input').change(function(){
	validateForm('message');
});
