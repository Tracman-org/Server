jQuery.extend(jQuery.easing,{
	easeInOutExpo: function(x, t, b, c, d){
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	}
});

$(document).ready(function(){
	
	$('a[href=#]').click(function(e){
		e.preventDefault();
		$('nav').removeClass('visible');
		$('html,body').stop().animate({scrollTop: $('.'+$(this).data('scrollto')).offset().top-65 }, 700, 'easeInOutExpo', function(){});
	});

});
