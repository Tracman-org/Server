var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
	name: {type:String, required:true},
	email: String,
	slug: {type:String, required:true, unique:true},
	requestId: String,
	isAdmin: {type:Boolean, required:true, default:false},
	isPro: {type:Boolean, required:true, default:false},
	created: Date,
	lastLogin: Date,
	googleID: {type:Number, unique:true},
	settings: {
		units: {type:String, default:'imperial'},
		defaultMap: {type:String, default:'road'},
		defaultZoom: {type:Number, default:11},
		showSpeed: {type:Boolean, default:false},
		showTemp: {type:Boolean, default:false},
		showAlt: {type:Boolean, default:false},
		showStreetview: {type:Boolean, default:false}
	},
	last: {
		time: Date,
		lat: Number,
		lon: Number,
		dir: Number,
		alt: Number,
		spd: Number
	},
	sk32: {type:String, required:true, unique:true}
});
