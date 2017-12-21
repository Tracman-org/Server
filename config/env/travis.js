'use strict'

module.exports = {
	
	// Local variables
	mode: 'production',
	session: process.env.SESSION,
	cookie: process.env.COOKIE,
	mongoSetup: process.env.MONGOSETUP,
	//url: 'https://tracman.org',
	port: 8080,
	
	// Mailserver
	mailserver: process.env.MAILSERVER,
	mailport: process.env.MAILPORT,
	mailauth: {
		user: process.env.MAILUSER,
		pass: process.env.MAILPASS,
	},
	
	// API keys
	recaptchaSitekey: process.env.RECAPTCHASITEKEY,
	recaptchaSecret: process.env.RECAPTCHASECRET,
	facebookAppId: process.env.FACEBOOKAPPID,
	facebookAppSecret: process.env.FACEBOOKAPPSECRET,
	twitterConsumerKey: process.env.TWITTERCONSUMERKEY,
	twitterConsumerSecret: process.env.TWITTERCONSUMERSECRET,
	googleClientId: process.env.GOOGLECLIENTID,
	googleClientSecret: process.env.GOOGLECLIENTSECRET,
	googleMapsAPI: process.env.GOOGLEMAPSAPI,
	
};
