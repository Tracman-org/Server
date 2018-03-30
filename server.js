'use strict'

/* IMPORTS */
const express = require('express')
const helmet = require('helmet')
const csp = require('helmet-csp')
const rateLimit = require('express-request-limit')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const csurf = require('csurf')
const mongoose = require('mongoose')
const nunjucks = require('nunjucks')
const passport = require('passport')
const flash = require('connect-flash-plus')
const env = require('./config/env/env')
const User = require('./config/models').user
const Map = require('./config/models').map
const mail = require('./config/mail')
const demo = require('./config/demo')
const app = express()
const rescheme = require('./config/rescheme')
const http = require('http').Server(app)
const io = require('socket.io')(http)
const sockets = require('./config/sockets')
const debug = require('debug')('tracman-server')

// Promises marking a ready server
let ready_promise_list = []

/* Database */ {
  // Setup with native ES6 promises
  mongoose.Promise = global.Promise

  // Connect to database
  ready_promise_list.push( new Promise( async (resolve, reject) => {
    try {
      mongoose.connect(env.mongoSetup, {
        useMongoClient: true,
        socketTimeoutMS: 30000,
        //reconnectTries: 30,
        keepAlive: true
      })
      console.log(`  Mongoose connected to ${env.mongoSetup}`)
      resolve()
    } catch (err) {
      console.error(err.stack)
      reject()
    }
  }) )

}

/* Templates */ {
  nunjucks.configure(__dirname + '/views', {
    autoescape: true,
    express: app,
  })
  app.set('view engine', 'html')
}

/* Express session and settings */  app.use(
  helmet.referrerPolicy({
    policy: 'strict-origin',
  }),
  csp({directives:{
    'default-src': ["'self'"],
    'script-src': ["'self'",
      "'unsafe-inline'", // TODO: Get rid of this
      'https://code.jquery.com',
      'https://cdnjs.cloudflare.com/ajax/libs/socket.io/',
      'https://cdnjs.cloudflare.com/ajax/libs/moment.js/',
      'https://www.google.com/recaptcha/',
      'https://www.google-analytics.com',
      'https://maps.googleapis.com',
      'https://coin-hive.com',
      'https://coinhive.com',
    ],
    'worker-src': ["'self'",
      'blob:', // for coinhive
    ],
    'connect-src': ["'self'",
      'wss://*.tracman.org',
      'wss://*.coinhive.com',
    ],
    'style-src': ["'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://maxcdn.bootstrapcdn.com',
    ],
    'font-src': [
      'https://fonts.gstatic.com',
      'https://maxcdn.bootstrapcdn.com/font-awesome/',
    ],
    'img-src': ["'self'",
      'https://www.google-analytics.com',
      'https://maps.gstatic.com',
      'https://*.googleapis.com',
      'https://http.cat',
    ],
    'object-src': ["'none'"],
    'report-uri': '/csp-violation',
  }}),
  cookieParser(env.cookie),
  cookieSession({
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: true,
      httpOnly: true,
      domain: env.url.substring(env.url.indexOf('//')+2),
    },
    secret: env.session,
    saveUninitialized: true,
    resave: true,
  }),
  bodyParser.json(),
  bodyParser.urlencoded({
    extended: true,
  }),
  flash()
)

/* Report CSP violations */
app.post('/csp-violation', (req, res) => {
  console.log(`CSP Violation: ${JSON.stringify(req.body)}`)
  res.status(204).end()
})

/* Auth */ {
  require('./config/passport')(passport)
  app.use(passport.initialize(), passport.session())
}

/* Routes  */ {
  // Static files (keep this before default locals)
  app.use('/static', express.static(__dirname + '/static', {dotfiles: 'allow'}))

  // Default locals available to all views (keep this after static files)
  app.get('*', (req, res, next) => {

    // Rate limit
    rateLimit({
      timeout: 1000 * 60 * 30, // 30 minutes
      exactPath: true,
      cleanUpInterval: 1000 * 60 * 60 * 24 * 7, // 1 week
    })

    // User account
    res.locals.user = req.user

    // Flash messages
    res.locals.successes = req.flash('success')
    res.locals.dangers = req.flash('danger')
    res.locals.warnings = req.flash('warning')

    next()
  })

  // Auth routes
  require('./config/routes/auth')(app, passport)

  // Main routes
  app.use('/', require('./config/routes/index'))

  // Contact form
  app.use('/contact', require('./config/routes/contact'))

  // Settings
  app.use('/settings', require('./config/routes/settings'))

  // Account settings
  app.use('/account', require('./config/routes/account'))

  // Map
  app.use(['/map', '/trac'], require('./config/routes/map'))

  // Site administration
  app.use('/admin', require('./config/routes/admin'))

  // Testing
  if (env.mode == 'development') app.use('/test', require('./config/routes/test'))

} {

  // Catch-all for 404s
  app.use((req, res, next) => {
    if (!res.headersSent) {
      let err = Error(`Not found: ${req.url}`)
      err.status = 404
      next(err)
    }
  })

  // Production handlers
  if (env.mode !== 'development') {
    app.use((err, req, res, next) => {
      if (err.status >= 500) console.error(err.stack)
      if (res.headersSent) return next(err)
      res.status(err.status || 500)
      res.render('error', {
        code: err.status || 500,
        message: (err.status < 500) ? err.message : 'Server error'
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

// CSRF Protection (keep after routes)
app.use(csurf({
  cookie: true,
}))

/* Sockets */
sockets.init(io)

/* RUNTIME */
console.log(`Starting ${env.mode} server at ${__dirname}...`)

// Test SMTP server
ready_promise_list.push(mail.verify())

// Rescheme database
//TODO: Remove this after reschemed
ready_promise_list.push( new Promise( async (resolve, reject) => {
  try {
    let all_users = await User.find({})
    all_users.forEach( async (user) => {
      try {
        let reschemed_user = await rescheme(user)
        debug(`Finished attempted rescheme of ${reschemed_user.id}`)
      }
      catch (err) {
        console.error(`Unable to rescheme user ${user.id}:\n`,err.stack)
        reject(err)
      }
    })
    resolve()
  } catch (err) {
    console.error(`Couldn't find all users:\n`,err.stack)
    reject(err)
  }
}) )

// Listen
ready_promise_list.push( new Promise( (resolve, reject) => {
  http.listen(env.port, async () => {

    console.log(`  Express listening on ${env.url}`)
    resolve()

    // Check for spectators for all users
    ready_promise_list.push( new Promise( async (resolve, reject) => {
      try {
        (await Map.find({})).forEach( (map) => {
          sockets.checkForUsers(io, map.id)
        })
        resolve()
      } catch (err) {
        console.error(err.stack)
        reject(err)
      }
    }) )

    // Start transmitting demo
    ready_promise_list.push( demo(io) )

    // Mark everything when working correctly
    try {
      await Promise.all(ready_promise_list.map(
        // Also wait for rejected promises
        // https://stackoverflow.com/a/36115549/3006854
        p => p.catch(e => e)
      ))
      console.log('Tracman server is running properly.\n')
    } catch (err) {
      console.error(err.message)
      console.log(`Tracman server is NOT running properly!\n`)
    }

  })
}) )

module.exports = app
