'use strict';

const mongoose = require('mongoose'),
	unique = require('mongoose-unique-validator'),
	bcrypt = require('bcrypt-nodejs');

const userSchema = new mongoose.Schema({
	name: {type:String, required:true},
	email: {type:String, required:true},
	slug: {type:String, required:true, unique:true},
	auth: {
		password: String,
		passToken: String,
		tokenExpires: Date,
		google: {type:String, unique:true},
		facebook: {type:String, unique:true},
		twitter: {type:String, unique:true},
	},
	isAdmin: {type:Boolean, required:true, default:false},
	isPro: {type:Boolean, required:true, default:false},
	created: Date,
	lastLogin: Date,
	settings: {
		units: {type:String, default:'standard'},
		defaultMap: {type:String, default:'road'},
		defaultZoom: {type:Number, default:11},
		showSpeed: {type:Boolean, default:false},
		showTemp: {type:Boolean, default:false},
		showAlt: {type:Boolean, default:false},
		showStreetview: {type:Boolean, default:false}
	},
	last: {
		time: Date,
		lat: {type:Number, default:0},
		lon: {type:Number, default:0},
		dir: {type:Number, default:0},
		alt: {type:Number, default:0},
		spd: {type:Number, default:0}
	},
	sk32: {type:String, required:true, unique:true}
}).plugin(unique);

/* User methods */ {
	
	// Generate hash for new password
	userSchema.methods.generateHash = function(password, next) {
		bcrypt.genSalt(8, function(err,salt){
			if (err){ return next(err); }
			bcrypt.hash(password, salt, null, next);
		});
	};

	// Create password reset token
	userSchema.methods.createToken = function(next){
		var user = this;
		require('crypto').randomBytes(16, function(err,buf){
			if (err){ next(err,null); }
			else {
				user.auth.passToken = buf.toString('hex');
				user.auth.tokenExpires = Date.now() + 3600000; // 1 hour
				user.save();
				return next(null,user.auth.passToken);
			}
		});
	};
	
	// Check for valid password
	userSchema.methods.validPassword = function(password, next) {
		bcrypt.compare(password, this.auth.password, next);
	};
	
}

module.exports = {
	'user': mongoose.model('User', userSchema)
};
