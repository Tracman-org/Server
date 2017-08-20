# <img align="left" src="/static/img/icon/by/48.png" alt="[]" title="The Tracman Logo">Tracman
###### v 0.7.5

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

#### v0.7.5
* Added pricing to homepage

#### v0.7.4
* Improved debugging
* Fixed bugs [#105](https://github.com/Tracman-org/Server/issues/105) and [#107](https://github.com/Tracman-org/Server/issues/107)
* [#89](https://github.com/Tracman-org/Server/issues/89) Can change marker color

#### v0.7.3
* Fixed [#102](https://github.com/Tracman-org/Server/issues/102) issue creating account

#### v0.7.2
* Added more debugging to fix auth problems

#### v0.7.0
* More bug fixes

#### v0.6.0-7
* Removed demo recording code
* Moved email server settings to env file
* Added SMTP check
* Minified static files
* Fixed error when creating user
* Removed extraneous packages
* Fixed [#87](https://github.com/Tracman-org/Server/issues/87), [#96](https://github.com/Tracman-org/Server/issues/96), [#92](https://github.com/Tracman-org/Server/issues/92), [#84](https://github.com/Tracman-org/Server/issues/84), [#76](https://github.com/Tracman-org/Server/issues/76), [#77](https://github.com/Tracman-org/Server/issues/77), [#32](https://github.com/Tracman-org/Server/issues/32), [#57](https://github.com/Tracman-org/Server/issues/57), [#58](https://github.com/Tracman-org/Server/issues/58), [#60](https://github.com/Tracman-org/Server/issues/60), [#50](https://github.com/Tracman-org/Server/issues/50), [#51](https://github.com/Tracman-org/Server/issues/51), [#52](https://github.com/Tracman-org/Server/issues/52), [#54](https://github.com/Tracman-org/Server/issues/54), [#55](https://github.com/Tracman-org/Server/issues/55), [#61](https://github.com/Tracman-org/Server/issues/61), [#62](https://github.com/Tracman-org/Server/issues/62)


## License

[view full license](LICENSE.md)

Tracman: GPS tracking service in node.js
Copyright © 2017 [Keith Irwin](https://keithirwin.us/)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see [http://www.gnu.org/licenses/](http://www.gnu.org/licenses/).
