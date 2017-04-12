# Tracman
###### v 0.5.1

node.js application to display a map with user's location.  

## Installation

```sh
$ git clone https://github.com/Tracman-org/Server.git && (cd Server && exec npm install)
```

You will need to set up a configuration file at `config/env.js`.  It should contain the following information: 

```javascript
'use strict';

module.exports = {

	env: 'development', // or 'production'
	
	// Random strings to prevent hijacking
	session: 'this is a secret',
	cookie: 'shhhhh',
	
	// Client IDs for authentication
	googleClientId: '############-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com',
	googleClientSecret: 'XXXXXXXXX_XXXXXXXXXXXXXX',
	
	// A google maps API
	googleMapsAPI: 'XXXXXXXXXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXX',
	
	// Location of your mongoDB
	mongoSetup: 'mongodb://localhost/tracman',
	
	// URL and port where Tracman will be run. 
	url: 'http://localhost:8080',
	port: 8080
	
};
```

You can get API keys at the [google developer's console](https://console.developers.google.com/apis/credentials).  You will need to set up approved hosts and auth callbacks.  There is more information in [their documentation](https://support.google.com/googleapi/answer/6158857?hl=en).  

## Running

```sh
$ npm start
```

Or with [nodemon](https://nodemon.io/):

```sh
$ npm dev
```

## Contributing

Tracman will be updated according to [this branching model](http://nvie.com/posts/a-successful-git-branching-model). 

## Changelog

#### v 0.5.1

* Fixed broken controls

#### v0.5.0

* Updated libraries
* Fixed recognition of attached clients [#34](https://github.com/Tracman-org/Server/issues/21)
* Moved socket.io code to own file. 
* Many minor fixes

#### v0.4.3

* Fixed memory store [#21](https://github.com/Tracman-org/Server/issues/21)

#### v0.4.2

* Fixed Streetview covering buttons
* Fixed error when viewing map of nonexistant user

#### v0.4.1

* Users can view/change email address
* Added linked accounts to admin

#### v0.4.0

* Opened registration
* Replaced 'Imperial' with 'Standard'
* Bug fixes

#### v0.3.0

* Unified map and dashboard UI
* Security updates
* New admin UI
