var emailTemplate = require('email-templates').EmailTemplate,
	path = require('path');
var secret = require('./secrets.js'),
	templateDir = path.join(__dirname, 'mail');
var mailgun = require('mailgun-js')({
	apiKey: secret.mailgunAPI,
	domain: 'tracman.org'
});

var renderMail = function(template, params, next) {
	new emailTemplate(path.join(templateDir, template))
	.render(params, function (err, msg) {
		if (err) { console.log('Error rendering mail.  Params: \n'+params+'\n'+err); }
		next(msg);
	});
}

module.exports = {
	mailgun:mailgun,
	
	sendInvite: function(params, cb){
		renderMail('invite', {id:params.id, name:params.name}, function(msg) {
			mailgun.messages().send({
				from: 'Tracman <invites@tracman.org>',
				to: params.email,
				subject: 'You are invited to use Tracman beta!',
				html: msg.html,
				text: msg.text
			}, cb);
		});
	},

	sendSuggestion: function(params, cb){
		renderMail('suggestion', params, function(msg) {
			var name = (params.name)?params.name:'Tracman';
			var email = (params.email)?' <'+params.email+'>':' <suggestions@tracman.org>';
			mailgun.messages().send({
				from: name+email,
				to: 'Keith Irwin <suggestions@tracman.org>',
				subject: 'A suggestion for Tracman',
				html: msg.html,
				text: msg.text
			}, cb);
		});
	},

	sendBugReport: function(params, cb){
		renderMail('suggestion', params, function(msg) {
			var name = (params.name)?params.name:'Tracman';
			var email = (params.email)?' <'+params.email+'>':' <suggestions@tracman.org>';
			mailgun.messages().send({
				from: name+email,
				to: 'Keith Irwin <bugs@tracman.org>',
				subject: 'A Bug Report for Tracman',
				html: msg.html,
				text: msg.text
			}, cb);
		});
	},
	
};
