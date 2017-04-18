'use strict';

const mongoose = require('mongoose'),
	unique = require('mongoose-unique-validator'),
	bcrypt = require('bcrypt-nodejs'),
	crypto = require('crypto');

const userSchema = new mongoose.Schema({
	name: {type:String},
	email: {type:String, required:true, unique:true},
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
	created: {type:Date, required:true},
	lastLogin: Date,
	settings: {
		units: {type:String, required:true, default:'standard'},
		defaultMap: {type:String, required:true, default:'road'},
		defaultZoom: {type:Number, required:true, default:11},
		showScale: {type:Boolean, required:true, default:false},
		showSpeed: {type:Boolean, required:true, default:false},
		showTemp: {type:Boolean, required:true, default:false},
		showAlt: {type:Boolean, required:true, default:false},
		showStreetview: {type:Boolean, required:true, default:false}
	},
	last: {
		time: Date,
		lat: {type:Number, required:true, default:0},
		lon: {type:Number, required:true, default:0},
		dir: {type:Number, required:true, default:0},
		alt: {type:Number, required:true, default:0},
		spd: {type:Number, required:true, default:0}
	},
	sk32: {type:String, required:true, unique:true}
}).plugin(unique);

/* User methods */ {
	
	//TODO: Return promises instead of taking callbacks
	
	// Generate hash for new password
	userSchema.methods.generateHash = function(password,next){
		bcrypt.genSalt(8, (err,salt)=>{
			if (err){ return next(err); }
			bcrypt.hash(password, salt, null, next);
		});
	};
	
	// Create password reset token
	userSchema.methods.createToken = function(next){
		var user = this;
		if ( user.auth.tokenExpires <= Date.now() ){
			
			// Reuse old token, resetting clock
			user.auth.tokenExpires = Date.now() + 3600000; // 1 hour
			user.save();
			return next(null,user.auth.passToken);
			
		} else {
			
			// Create new token
			crypto.randomBytes(16, (err,buf)=>{
				if (err){ next(err,null); }
				else {
					user.auth.passToken = buf.toString('hex');
					user.auth.tokenExpires = Date.now() + 3600000; // 1 hour
					user.save();
					return next(null,user.auth.passToken);
				}
			});
			
		}
	};
	
	// Check for valid password
	userSchema.methods.validPassword = function(password,next){
		bcrypt.compare(password, this.auth.password, next);
	};
	
}

module.exports = {
	'user': mongoose.model('User', userSchema)
};
