'use strict'

/* IMPORTS */
const express = require('express')
const bodyParser = require('body-parser')
const expressValidator = require('express-validator')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const debug = require('debug')('tracman-server')
const mongoose = require('mongoose')
const nunjucks = require('nunjucks')
const passport = require('passport')
const flash = require('connect-flash-plus')
const env = require('./config/env/env.js')
const User = require('./config/models.js').user
const mail = require('./config/mail.js')
const demo = require('./config/demo.js')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const sockets = require('./config/sockets.js')

// Promises marking a ready server
let ready_promise_list = []

/* Database */ {
  // Setup with native ES6 promises
  mongoose.Promise = global.Promise

  // Connect to database
  ready_promise_list.push( new Promise( (resolve, reject) => {
    mongoose.connect(env.mongoSetup, {
      useMongoClient: true,
      socketTimeoutMS: 30000,
      //reconnectTries: 30,
      keepAlive: true
    })
    .then( (db) => {
      console.log(`  Mongoose connected to ${env.mongoSetup}`)
      resolve()
    } )
    .catch( (err) => {
      console.error(err.stack)
      reject()
    } )
  }) )

}

/* Templates */ {
  nunjucks.configure(__dirname + '/views', {
    autoescape: true,
    express: app
  })
  app.set('view engine', 'html')
}

/* Session */ {
  app.use(cookieParser(env.cookie))
  app.use(cookieSession({
    cookie: {maxAge: 60000},
    secret: env.session,
    saveUninitialized: true,
    resave: true
  }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: true
  }))
  app.use(expressValidator())
  app.use(flash())
}

/* Auth */ {
  require('./config/passport.js')(passport)
  app.use(passport.initialize())
  app.use(passport.session())
}

/* Routes  */ {
  // Static files (keep this before default locals)
  app.use('/static', express.static(__dirname + '/static', {dotfiles: 'allow'}))

  // Default locals available to all views (keep this after static files)
  app.get('*', (req, res, next) => {
    // Path for redirects
    let nextPath = (
      (req.query.next) ? req.query.next
      : req.path.substring(0, req.path.indexOf('#')) || req.path)
    if (
      nextPath.substring(0, 6) !== '/login'||'/admin' &&
      nextPath.substring(0, 7) !== 'signup'||'/logout'||'/static'
    ) {
      req.session.next = nextPath + '#'
      debug(`Set redirect path to ${nextPath}#`)
    }

    // User account
    res.locals.user = req.user

    // Flash messages
    res.locals.successes = req.flash('success')
    res.locals.dangers = req.flash('danger')
    res.locals.warnings = req.flash('warning')

    next()
  })

  // Auth routes
  require('./config/routes/auth.js')(app, passport)

  // Main routes
  app.use('/', require('./config/routes/index.js'))

  // Contact form
  app.use('/contact', require('./config/routes/contact.js'))

  // Settings
  app.use('/settings', require('./config/routes/settings.js'))

  // Map
  app.use(['/map', '/trac'], require('./config/routes/map.js'))

  // Site administration
  app.use('/admin', require('./config/routes/admin.js'))

  // Testing
  if (env.mode == 'development') app.use('/test', require('./config/routes/test.js'))

} {

  // Catch-all for 404s
  app.use((req, res, next) => {
    if (!res.headersSent) {
      var err = new Error(`Not found: ${req.url}`)
      err.status = 404
      next(err)
    }
  })

  // Production handlers
  if (env.mode !== 'development') {
    app.use((err, req, res, next) => {
      if (err.status !== 404 && err.status !== 401) console.error(err.stack)
      if (res.headersSent) return next(err)
      res.status(err.status || 500)
      res.render('error', {
        code: err.status || 500,
        message: (err.status <= 499) ? err.message : 'Server error'
      })
    })

  // Development handlers
  } else {
    app.use((err, req, res, next) => {
      if (err.status !== 404) console.error(err.stack)
      if (res.headersSent) return next(err)
      res.status(err.status || 500)
      res.render('error', {
        code: err.status || 500,
        message: err.message,
        stack: err.stack
      })
    })
  }
}

/* Sockets */ {
  sockets.init(io)
}

/* RUNTIME */
console.log(`Starting ${env.mode} server at ${__dirname}...`)

// Test SMTP server
ready_promise_list.push(mail.verify())

// Listen
ready_promise_list.push( new Promise( (resolve, reject) => {
  http.listen(env.port, () => {

    console.log(`  Express listening on ${env.url}`)
    resolve()

    // Check for clients for each user
    ready_promise_list.push( new Promise( (resolve, reject) => {
      User.find({})
      .then((users) => {
        users.forEach((user) => {
          sockets.checkForUsers(io, user.id)
        })
        resolve()
      })
      .catch( (err) => {
        console.error(err.stack)
        reject()
      })
    }) )

    // Start transmitting demo
    ready_promise_list.push( demo(io) )

    // Mark everything when working correctly
    Promise.all(ready_promise_list.map(
      // Also wait for rejected promises
      // https://stackoverflow.com/a/36115549/3006854
      p => p.catch(e => e)
    )).then( () => {
      console.log('Tracman server is running properly\n')
      app.emit('ready') // Used for tests
    }).catch( (err) => {
      if (err) console.error(err.message)
      console.log(`Tracman server is not running properly!\n`)
    })

  })
}) )

module.exports = app
