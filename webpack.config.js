const path = require('path');

module.exports = {
	entry: {
		header: './static/js/header.js',
		footer: './static/js/footer.js',
		map: './static/js/map.js',
		controls: './static/js/map-controls.js',
		settings: './static/js/settings.js',
		password: './static/js/password.js'
	},
	output: {
		filename: '.[name].bun.js',
		path: path.resolve(__dirname, 'static/js')
	}
};