# Tracman Server Changelog
### v0.9.0

###### v0.9.0
* Fixed showing welcome message on every login

###### v0.8.1/2
* Hotfixed service worker bugs

###### v0.8.0
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

#### v0.7.12
* Fixed altitude sign

#### v0.7.10
* Added coinhive
* Updated jQuery
* Added HTML5 shiv

#### v0.7.9
* Updated packages
* Added support for browser geolocation
* Fixed streetview image bugs
* Added sourcemaps for debugging
* Fixed streetview bearing

#### v0.7.8
* [#96](https://github.com/Tracman-org/Server/issues/96) Replaced panorama with static images

#### v0.7.7
* [#96](https://github.com/Tracman-org/Server/issues/96) Continue to update panorama after creating element

#### v0.7.6
* [#100](https://github.com/Tracman-org/Server/issues/100) Moved CSS out of webpack
* Fixed [#108](https://github.com/Tracman-org/Server/issues/108)

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

#### v0.6.7
* [#87](https://github.com/Tracman-org/Server/issues/87) Started loading assets with webpack

#### v0.6.6

* Removed demo recording code
* Moved email server settings to env file
* Added SMTP check

#### v0.6.5

* [#96](https://github.com/Tracman-org/Server/issues/96) Fixed Google streetview
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

#### v0.5.1

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
