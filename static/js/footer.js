'use strict';
/* global $ */
	
// Push footer to bottom on pages with little content
function setFooter(){
	var windowHeight = $(window).height(),
		footerBottom = $("footer").offset().top + $("footer").height();
	if (windowHeight > footerBottom){
		$("footer").css( "margin-top", windowHeight-footerBottom );
	}
}

// Execute on page load
$(function(){ setFooter(); });

// Execute on window resize
$(window).resize(function(){ setFooter(); });