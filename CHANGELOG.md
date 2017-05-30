# Tracman Server Changelog
###### v 0.6.6

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
