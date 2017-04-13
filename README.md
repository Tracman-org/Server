# Tracman
###### v 0.5.1

node.js application to display a map with user's location.

## Installation

```sh
$ git clone https://github.com/Tracman-org/Server.git && (cd Server && exec npm install)
```

You will need to set up a configuration file at `config/env.js`.  Use `config/env-sample.js` for an example.  You can get API keys at the [google developer's console](https://console.developers.google.com/apis/credentials).  You will need to set up approved hosts and auth callbacks.  There is more information in [their documentation](https://support.google.com/googleapi/answer/6158857?hl=en).

## Running

```sh
$ npm run minify && npm start
```

or, using [nodemon](https://nodemon.io/):

```sh
$ npm run nodemon
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


## License

###### see [LICENSE.md](https://github.com/Tracman-org/Server/blob/master/LICENSE.md)

Tracman: GPS tracking service in node.js
Copyright © 2017 [Keith Irwin](https://keithirwin.us/)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see <[http://www.gnu.org/licenses/](http://www.gnu.org/licenses/)>.