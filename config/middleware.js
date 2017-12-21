'use strict'

const env = require('./env/env.js')
const debug = require('debug')('tracman-middleware')

module.exports = {

	// Throw error
	throwErr: (err, req=null) => {
		debug(`throwErr(${err.message},${req?req.url:'null'})`)
		console.error(err.stack)
		if (req) {
			if (env.mode==='production') {
				req.flash(
					'danger',
					'An error occured. <br>Would you like to \
					<a href="https://github.com/Tracman-org/Server/issues/new">report it</a>?'
				)
			// development
			} else req.flash('danger', err.message)
		}
	},

	// Capitalize the first letter of a string
	capitalize: (str) => {
		debug(`capitalize(${str})`)
		return str.charAt(0).toUpperCase() + str.slice(1)
	},
	
	// Validate an email address
	validateEmail: (email) => {
		debug(`validateEmail(${email})`)
		const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email)
	},

	// Ensure authentication
	ensureAuth: (req, res, next) => {
		debug(`ensureAuth(${req.url}, ${res.status}, ${next})`)
		if (req.isAuthenticated()) return next()
		else res.redirect('/login')
	},

	// Ensure administrator
	ensureAdmin: (req, res, next) => {
		debug(`ensureAdmin(${req.url}, ${res.status}, ${next})`)
		if (req.isAuthenticated() && req.user.isAdmin) return next()
		else { 
			let err = new Error("Unauthorized")
			err.status = 401
			next(err)
		}
		//TODO: test this by logging in as !isAdmin and go to /admin
	}

}
