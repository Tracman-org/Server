$(document).ready(function(){
	$(".hamburger").click(function(){
		$(".hamburger").toggleClass("is-active");
		$('nav').toggleClass('visible');
	});
});
