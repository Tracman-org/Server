'use strict';

const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
	host: 'keithirwin.us',
	port: 587,
	secure: false,
	requireTLS: true,
	auth: {
		user: 'NoReply@tracman.org',
		pass: 'Ei0UwfrZuE'
	},
  logger: true,
  debug: true
});

/* Confirm login */
// transporter.verify(function(err, success) {
// 	if (err){ console.error(`SMTP Error: ${err}`); }
// 	if (success){
// 		console.log("SMTP ready...");
// 	} else {
// 		console.error("SMTP not ready!");
// 	}
// });

/* Send test email */
transporter.sendMail({
  to: `"Keith Irwin" <mail@keithirwin.us>`,
  from: '"Tracman" <NoReply@tracman.org>',
  subject: 'Test email',
  text: "Looks like everything's working",
}).then(function(){
	console.log("Email should have sent...");
}).catch(function(err){
  console.error(err);
});

module.exports = transporter.sendMail.bind(transporter);