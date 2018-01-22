# <img align="left" src="/static/img/icon/by/48.png" alt="T" title="The Tracman Logo">Tracman
###### v 0.8.2

node.js application to display a sharable map with user's location.

[![Build Status](https://travis-ci.org/Tracman-org/Server.svg?branch=develop)](https://travis-ci.org/Tracman-org/Server)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Waffle.io - Columns and their card count](https://badge.waffle.io/Tracman-org/Server.svg?columns=all)](https://waffle.io/Tracman-org/Server)

## Installation

On unix-based systems:

```sh
git clone https://github.com/Tracman-org/Server.git tracman-server &&\
cd tracman-server &&\
npm install
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
(npm run minify & npm run build) && npm start
```

...or with [nodemon](https://nodemon.io/):

```sh
npm run nodemon
```

Nodemon will automatically minify and bundle files and restart the app when you make changes.  Check out the `nodemon.json` configuration.


## Contributing

Tracman will be updated according to [this branching model](http://nvie.com/posts/a-successful-git-branching-model)... more or less.  If you know anything about programming Android, [the Tracman android app](https://github.com/Tracman-org/Android) is more desperate for help.


## Changelog

[view full changelog](CHANGELOG.md)

###### v0.8.1/2
* Hotfixed service worker bugs

#### v0.8.0
* Added check to ensure only the newest location is sent
* Removed buggy login/-out redirects
* [#111](https://github.com/Tracman-org/Server/issues/111) Implemented service worker
* [#116](https://github.com/Tracman-org/Server/issues/116) Switched promises for async/await
* [#64](https://github.com/Tracman-org/Server/issues/64) Started using promises in model methods
* [#63](https://github.com/Tracman-org/Server/issues/63) Disconnect inactive clients
* [#110](https://github.com/Tracman-org/Server/issues/110) Implemented [StandardJS](https://standardjs.com/)
* Removed emojis
* [#113](https://github.com/Tracman-org/Server/issues/113) [#114](https://github.com/Tracman-org/Server/issues/114) Switched to useMongoClient
* [#67](https://github.com/Tracman-org/Server/issues/67) Fixed invisible marker in demo
* Shortened if statements and long lines

#### v0.7.x
* Fixed altitude sign
* Added coinhive
* Added HTML5 shiv
* Added support for browser geolocation
* Fixed streetview image bugs
* Added sourcemaps for debugging
* Fixed streetview bearing
* [#96](https://github.com/Tracman-org/Server/issues/96) Replaced panorama with static images
* [#96](https://github.com/Tracman-org/Server/issues/96) Continue to update panorama after creating element
* [#100](https://github.com/Tracman-org/Server/issues/100) Moved CSS out of webpack
* Fixed [#108](https://github.com/Tracman-org/Server/issues/108)
* Fixed bugs [#105](https://github.com/Tracman-org/Server/issues/105) and [#107](https://github.com/Tracman-org/Server/issues/107)
* [#89](https://github.com/Tracman-org/Server/issues/89) Can change marker color
* Fixed [#102](https://github.com/Tracman-org/Server/issues/102) issue creating account


## License

[view full license](LICENSE.md)

Tracman: GPS tracking service in node.js
Copyright © 2017 [Keith Irwin](https://keithirwin.us/)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see [http://www.gnu.org/licenses/](http://www.gnu.org/licenses/).
