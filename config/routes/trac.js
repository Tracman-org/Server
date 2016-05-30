var router = require('express').Router(),
  mw = require('../middleware.js'),
  secret = require('../secrets.js'),
  User = require('../models/user.js');

router.get('/:slug', function(req,res,next){
	User.findOne({slug:req.params.slug}, function(err, tracuser) {
		if (err){ mw.throwErr(req,err); }
		if (!tracuser){ next(); }
		else { res.render('trac.html',{
			api: secret.mapAPI,
			user: req.user,
			tracuser: tracuser,
			noFooter: '1',
			noHeader: (req.query.noheader)?req.query.noheader.match(/\d/)[0]:'',
			disp: (req.query.disp)?req.query.disp.match(/\d/)[0]:'' // 0=map, 1=streetview, 2=both
		}); }
	});
});

router.get('/id/:id', function(req,res,next){
	User.findById(req.params.id, function(err, user){
		if (err){ mw.throwErr(req,err); }
		if (!user){ next(); }
		else { res.redirect('/trac/'+user.slug+((req.url.indexOf('?')<0)?'':('?'+req.url.split('?')[1]))); }
	});
});

router.get('/', mw.ensureAuth, function(req,res,next){
	User.findById(req.session.passport.user, function(err, user){
		if (err){ mw.throwErr(req,err); }
		if (!user){ next(); }
		else { res.redirect('/trac/'+user.slug+((req.url.indexOf('?')<0)?'':('?'+req.url.split('?')[1]))); }
	});
});

module.exports = router;