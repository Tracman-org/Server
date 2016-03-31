var app = require('express')(),
	User = require('./models/user.js'),
	Request = require('./models/request.js'),
	bodyParser = require('body-parser'),
	slug = require('slug'),
	secret = require('./secrets.js'),
	passport = require('passport'),
	mail = require('./mail.js');

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

function throwErr(req,err) {
	console.log(err);
	req.flash('error-message',err);
	req.flash('error', (err.message||'')+'<br>Would you like to <a href="/bug">report this error</a>?');
}
function ensureAuth(req,res,next) {
	if (req.isAuthenticated()) { return next(); }
	else {
		req.session.returnTo = req.path;
		req.flash('error', 'You must be signed in to do that.  <a href="/login">Click here to log in</a>.  ');
		res.redirect('/');
	}
}
function ensureAdmin(req,res,next) {
	if (req.user.isAdmin) { return next(); }
	else { res.sendStatus(401); }
}

module.exports = function(app){
	app.get('/robots.txt', function(req,res){ 
		res.type('text/plain');
		res.send("User-agent: *\n"+
			"Disallow: /trac\n"+
			"Disallow: /dashboard\n"+
			"Disallow: /invited"
		);
	});
	
	app.route('/')
		.all(function(req,res,next){
			next();
		}).get(function(req,res,next){
			if (req.session.passport) {
				User.findById(req.session.passport.user, function(err, user){
					if (err){ throwErr(req,err); }
					if (!user){ next(); }
					res.render('index.html', {
						user: user,
						error: req.flash('error')[0],
						success: req.flash('succcess')[0]
					});
				});
			} else {
				res.render('index.html', {
					error: req.flash('error')[0],
					success: req.flash('success')[0],
					inviteSuccess: req.flash('request-success')[0],
					inviteError: req.flash('request-error')[0]
				});
			}
		}).post(function(req,res){
			Request.findOne({email:req.body.email}, function(err, request) {
				if (err){ throwErr(req,err); }
				if (request){ // Already requested with this email
					req.flash('request-error', 'Invite already requested!  ');
					res.redirect('/#get');
				} else { // Send new request
					request = new Request({
						name: req.body.name,
						email: req.body.email,
						beg: req.body.why,
						requestedTime: Date.now()
					}); request.save(function(err) {
						if (err){ throwErr(req,err); }
						mail.mailgun.messages().send({
							from: 'Tracman Requests <requests@tracman.org>',
							to: 'Keith Irwin <tracman@keithirwin.us>',
							subject: 'New Tracman Invite request',
							html: '<p>'+req.body.name+' requested a Tracman invite.  </p><p>'+req.body.why+'</p><p><a href="http://tracman.org/admin/requests">See all invites</a></p>',
							text: '\n'+req.body.name+' requested a Tracman invite.  \n\n'+req.body.why+'\n\nhttp://tracman.org/admin/requests'
						}, function(err,body){
							if (err){ throwErr(req,err); }
							else { req.flash('request-success', 'Invite requested!  '); }
							res.redirect('/#get');
						});
					});
				}
			});
		});	

	app.route('/dashboard')
		.all(ensureAuth, function(req,res,next){
			next();
		}).get(function(req,res,next){
			User.findById(req.session.passport.user, function(err, user){
				if (err){ throwErr(req,err); }
				if (!user){ next(); }
				else if (req.session.returnTo && req.query.rd) {
					res.redirect(req.session.returnTo);
					delete req.session.returnTo;
				} else { res.render('dashboard.html', {
					user: user,
					success: req.flash('success')[0],
					error: req.flash('error')[0]
				}); }
			});
		}).post(function(req,res){
			User.findByIdAndUpdate(req.session.passport.user, {$set:{
				name: req.body.name,
				slug: slug(req.body.slug),
				settings: {
					units: req.body.units,
					defaultMap: req.body.map,
					defaultZoom: req.body.zoom,
					showSpeed: (req.body.showSpeed)?true:false,
					showAlt: (req.body.showAlt)?true:false,
					showStreetview: (req.body.showStreet)?true:false
				}
			}}, function(err, user){
				if (err) { throwErr(req,err); }
				else { req.flash('success', 'Settings updated.  '); }
				res.redirect('/dashboard');
			});
		});
	app.get('/validate', function(req,res){
		if (req.query.slug) { // validate unique slug
			User.findOne({slug:slug(req.query.slug)}, function(err, existingUser){
				if (err) { console.log('/validate error:',err); }
				if (existingUser && existingUser.id!==req.session.passport.user) { res.sendStatus(400); }
				else { res.sendStatus(200); }
			});
		}
	});

	app.get('/trac', ensureAuth, function(req,res,next){
		User.findById(req.session.passport.user, function(err, user){
			if (err){ throwErr(req,err); }
			if (!user){ next(); }
			else { res.redirect('/trac/'+user.slug+((req.url.indexOf('?')<0)?'':('?'+req.url.split('?')[1]))); }
		});
	});
	app.get('/trac/:slug', function(req,res,next){
		User.findOne({slug:req.params.slug}, function(err, tracuser) {
			if (err){ throwErr(req,err); }
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
	app.get('/trac/id/:id', function(req,res,next){
		User.findById(req.params.id, function(err, user){
			if (err){ throwErr(req,err); }
			if (!user){ next(); }
			else { res.redirect('/trac/'+user.slug+((req.url.indexOf('?')<0)?'':('?'+req.url.split('?')[1]))); }
		});
	});
	app.get('/invited/:invite', function(req,res,next){
		User.findOne({requestId:req.params.invite}, function(err, existingUser) { // User already accepted invite
			if (err) { console.log('routes.js:121 ERROR: '+err); }
			if (existingUser) { res.redirect('/login'); }
			else {
				Request.findById(req.params.invite, function(err, request) { // Check for granted invite
					if (err) { throwErr(req,err); }
					if (!request) { next(); }
					else {
						new User({ // Create new user
							requestId: request._id,
							email: '',
							slug: request._id,
							name: request.name,
							created: Date.now(),
							settings: {
								units: 'imperial',
								showSpeed: false,
								showTemp: false,
								showAlt: false,
								showStreetview: true
							}
						}).save(function(err) {
							if (err) { throwErr(req,err); }
							User.findOne({requestId:request._id}, function(err, user) {
								if (err) { throwErr(req,err); }
								if (user) {
									request.userId = user._id;
									request.save(function(err, raw){
										if (err){ throwErr(req,err); }
									});
									req.logIn(user, function(err) {
										if (err) { throwErr(req,err); }
										user.lastLogin = Date.now();
										user.save(function(err, raw) {
											if (err) { throwErr(req,err); }
											res.redirect('/login');
										});
									});
								}
							});
						});
					}
				});
			}
		});
	});

	app.get('/android', ensureAuth, function(req,res){
		res.redirect('https://play.google.com/store/apps/details?id=us.keithirwin.tracman');
	});
	app.get('/license', function(req,res){
		res.render('license.html', {user:req.user});
	});
	app.route('/pro')
		.all(ensureAuth, function(req,res,next){
			next();
		}).get(function(req,res,next){
			User.findById(req.session.passport.user, function(err, user){
				if (err){ throwErr(req,err); }
				if (!user){ next(); }
				else { res.render('pro.html', {user:user}); }
			});
		}).post(function(req,res){
			User.findByIdAndUpdate(req.session.passport.user,
				{$set:{ isPro:true }},
				function(err, user){
					if (err){ throwErr(req,err); }
					else { req.flash('success','You have been signed up for pro. '); }
					res.redirect('/dashboard');
				}
			);
		});

	app.route('/suggestion')
		.get(function(req,res){
			res.render('suggestion.html', {user:req.user});
		}).post(function(req,res){
			mail.sendSuggestion({
				name: (req.body.name)?req.body.name:req.user.name,
				email: (req.body.email)?req.body.email:req.user.email,
				suggestion: req.body.suggestion
			}, function (err, raw) {
				if (err){ throwErr(req,err); }
				else { req.flash('success','Thanks for the suggestion! '); }
				res.redirect('/dashboard');
			});
		});
	app.route('/bug').all(ensureAuth, function(req,res,next){
			next();
		}).get(function(req,res){
			res.render('bug.html', {
				user: req.user,
				errorMessage: req.flash('error-message')
			});
		}).post(function(req,res){
			mail.sendBugReport({
				source: (req.query.source)?req.body.name:'web',
				name: (req.body.name)?req.body.name:req.user.name,
				email: (req.body.email)?req.body.email:req.user.email,
				errorMessage: req.body.errorMessage,
				recreation: req.body.recreation,
				bug: req.body.bug
			}, function (err, raw) {
				if (err){ throwErr(req,err); }
				else { req.flash('success','Thanks for the report! '); }
				res.redirect('/dashboard');
			});
		});

	// ADMIN
	app.route('/admin/requests')
		.all([ensureAuth, ensureAdmin], function(req,res,next){
			next();
		}).get(function(req,res){
			User.findById(req.session.passport.user, function(err, user){
				if (err){ req.flash('error', err.message); }
				Request.find({}, function(err, requests){
					if (err) { req.flash('error', err.message); }
					res.render('admin/requests.html', {
						user: user,
						noFooter: '1',
						requests: requests,
						success:req.flash('success')[0],
						error:req.flash('error')[0]
					});
				});
			});
		}).post(function(req,res){
			Request.findById(req.body.invite, function(err, request){
				if (err){ req.flash('error', err.message); }
				mail.sendInvite(request, function (err, raw) {
					if (err) { req.flash('error', err.message); }
					request.granted = Date.now();
					request.save(function(err) {
						if (err) { req.flash('error', err.message); }
					});
					req.flash('success', 'Invitation sent to <i>'+request.name+'</i>.');
					res.redirect('/admin/requests');
				});
			});
		});
	app.get('/admin/users', [ensureAuth, ensureAdmin], function(req,res){
		User.findById(req.session.passport.user, function(err, user){
			if (err){ req.flash('error', err.message); }
			User.find({}, function(err, users){
				if (err) { req.flash('error', err.message); }
				res.render('admin/users.html', {
					user: user,
					users: users,
					noFooter: '1',
					success:req.flash('success')[0],
					error:req.flash('error')[0]
				});
			});
		});
	});

	// AUTH
	app.get('/login', function(req,res){
		res.redirect('/auth/google');
	});
	app.get('/logout', function(req,res){
		req.logout();
		res.redirect('/');
	});
	app.get('/auth/google', passport.authenticate('google', { scope: [
		'https://www.googleapis.com/auth/plus.login',
		'https://www.googleapis.com/auth/plus.profile.emails.read'
	] }));
	app.get('/auth/google/callback', passport.authenticate('google', {
		failureRedirect: '/',
		failureFlash: true,
		successRedirect: '/dashboard?rd=1',
		successFlash: true
	} ));
	app.get('/auth/google/idtoken', passport.authenticate('google-id-token'),	function (req,res) {
		if (!req.user) { res.sendStatus(401); }
		else { res.send(req.user); }
	} );
};
