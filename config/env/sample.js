'use strict';

module.exports = {
	
	// Log level
	// See https://www.npmjs.com/package/winston#logging-levels
	logLevel: 'verbose',
	
	// Local variables
	mode: 'development', // or production
	
	// Random strings to prevent hijacking
	session: 'SomeSecret',
	cookie: 'SomeOtherSecret',
	
	// Location of your mongoDB
	mongoSetup: 'mongodb://localhost:27017/tracman',
	// Or use the test database from mLab
	//mongoSetup: 'mongodb://tracman:MUPSLXQ34f9cQTc5@ds113841.mlab.com:13841/tracman-dev',
	
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
