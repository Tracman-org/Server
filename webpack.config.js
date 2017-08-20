const path = require('path'),
	uglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	
	// Javascript files to be bundled
	entry: {
		base: './static/js/base.js',
		header: './static/js/header.js',
		footer: './static/js/footer.js',
		index: './static/js/index.js',
		table: './static/js/table.js',
		form: './static/js/form.js',
		contact: './static/js/contact.js',
		login: './static/js/login.js',
		map: './static/js/map.js',
		controls: './static/js/controls.js',
		settings: './static/js/settings.js',
		password: './static/js/password.js'
	},
	
	// Output format
	output: {
		filename: '.[name].bun.js',
		path: path.resolve(__dirname, 'static/js')
	},
	
	plugins: [
		
		// Minimize JS
		new uglifyJsPlugin()
		
	],
	
	module: {
		
		rules: [
			
			// Load CSS into bundles
			{
				test: /\.css$/,
				use: [ 'style-loader', 'css-loader' ]
			}
			
		]
	}
	
};