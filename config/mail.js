'use strict';

const nodemailer = require('nodemailer'),
	env = require('./env/env.js');

let transporter = nodemailer.createTransport({
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

/* Confirm login */
// transporter.verify( (err,success)=>{
// 	if (err){ console.error(`SMTP Error: ${err}`); }
// 	console.log(`SMTP ${!success?'not ':''}ready...`);
// } );

module.exports = {
	
	send: transporter.sendMail.bind(transporter),
	
	text: (text)=>{
		return `Tracman\n\n${text}\n\nDo not reply to this email\nFor information about why you received this email, see the privacy policy at ${env.url}/privacyy#email`;
	},
	
	html: (text)=>{
		return `<h1><a href="/" style="text-decoration:none;"><span style="color:#000;font-family:sans-serif;font-size:36px;font-weight:bold"><img src="${env.url}/static/img/icon/by/32.png" alt="+" style="margin-right:10px">Tracman</span></a></h1>${text}<p style="font-size:8px;">Do not reply to this email.  For information about why you recieved this email, see our <a href="${env.url}/privacy#email">privacy policy</a>. </p>`;
	},
	
	from: `"Tracman" <NoReply@tracman.org>`,
	
	to: (user)=>{
		return `"${user.name}" <${user.email}>`;
	}
	
};