'use strict';
/* global location $ */

// Validate email addresses
function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

// Replace inputed value with response
function validateFromEndpoint(type, selector, cb) {
	$.get('/validate?'+type+'='+$(selector).val())
	.done(function(data){
		$(selector).val(data);
		cb();
	});
}

// On page load
$(function(){

	function validateForm(input) {
		
		// Everything passed - make sure no help texts are visible
		function recheckInputs() {
			if ($('#email-help').is(":visible")) {
				$('#submit-group .main').prop('disabled',true).prop('title',"You need to supply a different email address. ");
			}
			else if ($('#slug-help').is(":visible")) {
				$('#submit-group .main').prop('disabled',true).prop('title',"You need to supply a different slug. ");
			}
			else {
				$('#submit-group .main').prop('disabled',false).prop('title',"Click here to save your changes. ");
			}
		}
		
		// Empty fields
		if ($('#slug-input').val()===''){
			$('#slug-help').show().text("A slug is required. ");
			$('#submit-group .main').prop('disabled',true).prop('title',"You need to enter a slug. ");
		}
		else if ($('#email-input').val()===''){
			$('#email-help').show().text("An email is required. ");
			$('#submit-group .main').prop('disabled',true).prop('title',"You need to enter an email address. ");
		}
		
		// Is email
		else if (!validateEmail($('#email-input').val())) {
			$('#email-help').show().text("You must enter a valid email address. ");
			$('#submit-group .main').prop('disabled',true).prop('title',"You need to enter a valid email address. ");
		}
		
		// Validate unique fields with server
		else if (input) {
			
			// Make AJAX request
			$.get('/validate?'+input+'='+$('#'+input+'-input').val())
			.fail(function(data,status){
				
				// Input is not unique
				if (status===400) {
					$('#'+input+'-help').show().text("That "+input+" is already in use by another user. ");
					$('#submit-group .main').prop('disabled',true).prop('title',"You need to supply a different "+input+". ");
				}
				
				// Server error
				else {
					$('#'+input+'-help').show().text("Unable to confirm unique "+input+" with the server. This might not work... ");
					recheckInputs();
				}
				
			})
			
			// Input is unique
			.done(function(){
				$('#'+input+'-help').hide();
				recheckInputs();
			});
				
		}
		
		// All passed
		else { recheckInputs(); }
		
	}
	
	// Validate slug
	$('#slug-input').change(function(){
		validateFromEndpoint('slugify','#slug-input',function(){
			validateForm(slug);
		});
	});
	
	// Validate email
	$('#email-input').change(function(){
		validateForm('email');
	});
	
	// Validate name
	$('#name-input').change(function(){
		validateFromEndpoint('xss','#name-input',validateForm);
	});
	
	// Delete account
	$('#delete').click(function(){
		if (confirm("Are you sure you want to delete your account?  This CANNOT be undone! ")) {
			$.ajax({
				url: "/settings",
				type: "DELETE",
				success: function(){
					location.reload();
				},
				fail: function(){
					alert("Failed to delete account!");
				}
			});
		}
	});
	
});
