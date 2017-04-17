'use strict';

module.exports = {
	
	// Local variables
	mode: 'development', // or production
	
	// Random strings to prevent hijacking
	session: 'SomeSecret',
	cookie: 'SomeOtherSecret',
	
	// Location of your mongoDB
	mongoSetup: 'mongodb://localhost:27017/tracman',
	
	// URL and port where this will run
	url: 'https://localhost:8080',
	port: 8080,
	
	// OAuth API keys
	facebookAppId: 'XXXXXXXXXXXXXXXX',
	facebookAppSecret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
	twitterConsumerKey: 'XXXXXXXXXXXXXXXXXXXXXXXXX',
	twitterConsumerSecret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
	googleClientId: '############-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com',
	googleClientSecret: 'XXXXXXXXX_XXXXXXXXXXXXXX',
	
	// Google maps API key
	googleMapsAPI: 'XXXXXXXXXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXX'
	
};
