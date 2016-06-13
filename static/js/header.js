$(document).ready(function(){
	
	// Open drawer with hamburger
	$('.hamburger').click(function(){
		$('.hamburger').toggleClass('is-active');
		$('nav').toggleClass('visible');
	});
	
	// Close drawer after tapping on nav
	$('nav').click(function(){
		$('.hamburger').removeClass('is-active');
		$('nav').removeClass('visible');
	});
	
	// Close drawer by tapping outside it
	$('.wrap, section').click(function(){
		$('.hamburger').removeClass('is-active');
		$('nav').removeClass('visible');
	});
	
});
