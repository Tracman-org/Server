var path = require('path');

module.exports = {
	entry: './static/map.js',
	output: {
		filename: 'map.js',
		path: path.resolve(__dirname, 'static/dist')
	}
};