'use strict';

const mongoose = require('mongoose'),
	unique = require('mongoose-unique-validator'),
	bcrypt = require('bcrypt-nodejs'),
	crypto = require('crypto');

const userSchema = new mongoose.Schema({
	name: {type:String},
	email: {type:String, unique:true},
	newEmail: String,
	emailToken: String,
	slug: {type:String, required:true, unique:true},
	auth: {
		password: String,
		passToken: String,
		passTokenExpires: Date,
		google: {type:String, unique:true},
		facebook: {type:String, unique:true},
		twitter: {type:String, unique:true},
	},
	isAdmin: {type:Boolean, required:true, default:false},
	isPro: {type:Boolean, required:true, default:false},
	created: {type:Date, required:true},
	lastLogin: Date,
	settings: {
		units: {type:String, default:'standard'},
		defaultMap: {type:String, default:'road'},
		defaultZoom: {type:Number, default:11},
		showScale: {type:Boolean, default:false},
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
	
	//TODO: Return promises instead of taking callbacks
	// See https://gist.github.com/7h1b0/5154fda207e68ad1cefc#file-random-js
	// For an example
	
	// Create email confirmation token
	userSchema.methods.createEmailToken = function(next){ // next(err,token)
		//console.log('user.createEmailToken() called');
		var user = this;
		
		crypto.randomBytes(16, (err,buf)=>{
			if (err){ next(err,null); }
			if (buf){
				//console.log(`Buffer ${buf.toString('hex')} created`);
				user.emailToken = buf.toString('hex');
				user.save()
				.then( ()=>{
					return next(null,user.emailToken);
				})
				.catch( (err)=>{
					return next(err,null);
				});
				
			}
		});
		
	};

	// Create password reset token
	userSchema.methods.createPassToken = function(next){ // next(err,token,expires)
		var user = this;
		
		// Reuse old token, resetting clock
		if ( user.auth.passTokenExpires >= Date.now() ){
			//console.log(`Reusing old password token...`);
			user.auth.passTokenExpires = Date.now() + 3600000; // 1 hour
			user.save()
			.then( ()=>{
				return next(null,user.auth.passToken,user.auth.passTokenExpires);
			})
			.catch( (err)=>{
				return next(err,null,null);
			});
		}
		
		// Create new token
		else {
			//console.log(`Creating new password token...`);
			crypto.randomBytes(16, (err,buf)=>{
				if (err){ return next(err,null,null); }
				if (buf) {
					user.auth.passToken = buf.toString('hex');
					user.auth.passTokenExpires = Date.now() + 3600000; // 1 hour
					user.save()
					.then( ()=>{
						return next(null,user.auth.passToken,user.auth.passTokenExpires);
					})
					.catch( (err)=>{
						return next(err,null,null);
					});
				}
			});
		}
		
	};
	
	// Generate hash for new password
	userSchema.methods.generateHash = function(password,next){
		// next(err,hash);
		bcrypt.genSalt(8)
		.then( (salt)=>{
			bcrypt.hash(password, salt, null, next);
		})
		.catch( (err)=>{ return next(err,null); });
	};
	
	// Check for valid password
	userSchema.methods.validPassword = function(password,next){
		bcrypt.compare(password, this.auth.password, next);
	};
	
}

module.exports = {
	'user': mongoose.model('User', userSchema)
};
