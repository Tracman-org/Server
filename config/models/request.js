var mongoose = require('mongoose');

module.exports = mongoose.model('Request', {
	name: {type:String, required:true},
	email: {type:String, required:true, unique:true},
	beg: String,
	requestedTime: Date,
	granted: Date, 
	userId: String
});
