var router = require('express').Router(),
  mw = require('../middleware.js'),
  slug = require('slug'),
  User = require('../models/user.js');

router.get('/robots.txt', function(req,res){ 
	res.type('text/plain');
	res.send("User-agent: *\n"+
		"Disallow: /map\n"+
		"Disallow: /invited"
	);
});

router.get('/validate', function(req,res){
	if (req.query.slug) { // validate unique slug
		User.findOne({slug:slug(req.query.slug)}, function(err, existingUser){
			if (err) { console.log('/validate error:',err); }
			if (existingUser && existingUser.id!==req.session.passport.user) { res.sendStatus(400); }
			else { res.sendStatus(200); }
		});
	}
});

router.get('/android', function(req,res){
	res.redirect('https://play.google.com/store/apps/details?id=us.keithirwin.tracman');
});

router.get('/license', function(req,res){
	res.render('license.html', {user:req.user});
});

router.route('/pro')
	.all(mw.ensureAuth, function(req,res,next){
		next();
	}).get(function(req,res,next){
		User.findById(req.session.passport.user, function(err, user){
			if (err){ mw.throwErr(req,err); }
			if (!user){ next(); }
			else { res.render('pro.html', {user:user}); }
		});
	}).post(function(req,res){
		User.findByIdAndUpdate(req.session.passport.user,
			{$set:{ isPro:true }},
			function(err, user){
				if (err){ mw.throwErr(req,err); }
				else { req.flash('success','You have been signed up for pro. '); }
				res.redirect('/map');
			}
		);
	});

module.exports = router;