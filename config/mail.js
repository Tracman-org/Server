'use strict';

module.exports = require('nodemailer').createTransport({
	host: 'keithirwin.us',
	port: 587,
	secure: false,
	requireTLS: true,
	auth: {
		user: 'NoReply@tracman.org',
		pass: 'Ei0UwfrZuE'
	},
  // logger: true,
  // debug: true
});

// require('./mail.js').(mailData, context).then(...).catch(...);