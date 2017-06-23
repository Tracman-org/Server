var path = require('path');

module.exports = {
	entry: './static/js/src/map.js',
	output: {
		filename: 'map.js',
		path: path.resolve(__dirname, 'static/js/dist')
	},
	externals: {
		google: 'google'
	}
};