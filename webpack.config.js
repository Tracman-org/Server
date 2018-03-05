const path = require('path')
const env = require('./config/env/env.js')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {

  // Javascript files to be bundled
  entry: {
    base: './static/js/base.js',
    header: './static/js/header.js',
    footer: './static/js/footer.js',
    contact: './static/js/contact.js',
    login: './static/js/login.js',
    map: './static/js/map.js',
    settings: './static/js/settings.js',
    password: './static/js/password.js',
    sw: './static/sw.js',
  },

  // Sourcemaps
  devtool: (env.mode === 'development') ? 'inline-source-map' : false,

  // Output format
  output: {
    filename: '.[name].bun.js',
    path: path.resolve(__dirname, 'static/js')
  },

  plugins: [
    // Minimize JS
    new UglifyJsPlugin()
  ]

}
