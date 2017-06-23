var path = require('path');

module.exports = {
	entry: {
		header: './static/js/src/header.js',
		footer: './static/js/src/footer.js',
		map: './static/js/src/map.js',
		controls: './static/js/src/map-controls.js',
		settings: './static/js/src/settings.js',
		password: './static/js/src/password.js',
		mellt: './static/js/src/mellt.js',
		commonpasswords: './static/js/src/common-passwords.js'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'static/js/dist')
	}
};