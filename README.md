# <img align="left" src="/static/img/icon/by/48.png" alt="[]" title="The Tracman Logo">Tracman
###### v 0.6.7

node.js application to display a sharable map with user's location.


## Installation

On unix-based systems:

```sh
git clone https://github.com/Tracman-org/Server.git &&\
mv Server tracman-server && cd tracman-server &&\
exec npm install
```

You will need to set up a configuration file at `config/env/env.js`.  Use `config/env/sample.js` for an example.  You can get API keys at the [google developer's console](https://console.developers.google.com/apis/credentials).  You will need to set up approved hosts and auth callbacks.  There is more information in [their documentation](https://support.google.com/googleapi/answer/6158857?hl=en).  

A good method is to simply copy the sample configuration and point `config/env/env.js` to the new version: 

```sh
cp config/env/sample.js config/env/local-config.js
echo "module.exports = require('./local-config.js');" > config/env/env.js
```

Then edit `config/env/local-config.js` to match your local environment.  


## Usage

Run Tracman with npm: 

```sh
npm run minify && npm start
```

...or with [nodemon](https://nodemon.io/):

```sh
npm run nodemon
```

Nodemon will automatically minify files and restart the app when you make changes.  Check out the `nodemon.json` configuration.  


## Contributing

Tracman will be updated according to [this branching model](http://nvie.com/posts/a-successful-git-branching-model)... more or less.  If you know anything about programming Android, [the Tracman android app](https://github.com/Tracman-org/Android) is more desperate for help.  


## Changelog

[view full changelog](CHANGELOG.md)

#### v0.6.7
* [#87](https://github.com/Tracman-org/Server/issues/87) Started loading assets with webpack

#### v0.6.6

* Removed demo recording code
* Moved email server settings to env file
* Added SMTP check

#### v0.6.5

* [#96](https://github.com/Tracman-org/Server/issues/96) Fixed google streetview
* Various minor fixes

#### v0.6.4

* [#92](https://github.com/Tracman-org/Server/issues/92) Fixed blank map issue

#### v0.6.3

* [#84](https://github.com/Tracman-org/Server/issues/84) Fixed password reset page

#### v0.6.2

* [#76](https://github.com/Tracman-org/Server/issues/76) Prevented users with no password from deleting google social login
* Fixed error when creating user

#### v0.6.1

* [#77](https://github.com/Tracman-org/Server/issues/77) Fixed 500 after password change, swapped `bcrypt` for `bcrypt-nodejs`
* Removed extraneous packages

#### v0.6.0

* [#32](https://github.com/Tracman-org/Server/issues/32), [#57](https://github.com/Tracman-org/Server/issues/57), [#58](https://github.com/Tracman-org/Server/issues/58), [#60](https://github.com/Tracman-org/Server/issues/60) Added more login options
* [#50](https://github.com/Tracman-org/Server/issues/50) Replaced some callbacks with promises
* Minified static files
* [#51](https://github.com/Tracman-org/Server/issues/51), [#52](https://github.com/Tracman-org/Server/issues/52) Added settings validations
* [#54](https://github.com/Tracman-org/Server/issues/54), [#55](https://github.com/Tracman-org/Server/issues/55) Made map work better
* [#61](https://github.com/Tracman-org/Server/issues/61) New MongoDB security
* [#62](https://github.com/Tracman-org/Server/issues/62) Fixed error handling


## License

[view full license](LICENSE.md)

Tracman: GPS tracking service in node.js
Copyright © 2017 [Keith Irwin](https://keithirwin.us/)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see [http://www.gnu.org/licenses/](http://www.gnu.org/licenses/).
