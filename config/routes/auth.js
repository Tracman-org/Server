'use strict' /* global sendToken */

const mw = require('../middleware')
const mail = require('../mail')
const User = require('../models').user
const Map = require('../models').map
const Vehicle = require('../models').vehicle
const crypto = require('crypto')
const moment = require('moment')
const sanitize = require('mongo-sanitize')
const debug = require('debug')('tracman-routes-auth')
const env = require('../env/env')

module.exports = (app, passport) => {

  // Methods for success and failure
  const loginOutcome = {
    failureRedirect: '/login',
    failureFlash: true
  }
  const loginCallback = (req, res) => {
    debug(`Logged in... redirecting to /map`)
    req.flash(req.session.flashType, req.session.flashMessage)
    req.session.flashType = undefined
    req.session.flashMessage = undefined
    res.redirect('/map')
  }
  const appLoginCallback = (req, res, next) => {
    debug('appLoginCallback called.')
    if (req.user) res.send(req.user)
    else {
      let err = new Error('Unauthorized')
      err.status = 401
      next(err)
    }
  }

  // Login/-out
  app.route('/login')
    .get((req, res) => {
      // Already logged in
      if (req.isAuthenticated()) loginCallback(req, res)
      // Show login page
      else res.render('login')
    })
    .post(passport.authenticate('local', loginOutcome), loginCallback)
  app.get('/logout', (req, res) => {
    req.logout()
    debug(`Logged out, redirecting to /`)
    req.flash('success', `You have been logged out.`)
    res.redirect( '/')
  })

  // Signup
  app.route('/signup')
    .get((req, res) => {
      res.redirect('/login#signup')
    })
    .post( async (req, res, next) => {

      // Send token and alert user
      function sendToken(user) {
        debug(`sendToken() called for user ${user.id}`)
        return new Promise( async (resolve, reject) => {
          try {

            // Create a new password token
            let [token, expires] = await user.createPassToken()
            debug(`Created password token for user ${user.id} successfully`)

            // Figure out expiration time string
            debug(`Determining expiration time string for ${expires}...`)
            let expiration_time_string = (req.query.tz)
              ? moment(expires).utcOffset(req.query.tz).toDate().toLocaleTimeString(req.acceptsLanguages[0])
              : moment(expires).toDate().toLocaleTimeString(req.acceptsLanguages[0]) + ' UTC'

            // Email the instructions to continue
            debug(`Emailing new user ${user.id} at ${user.email} instructions to create a password...`)
            resolve( await mail.send({
              from: mail.noReply,
              to: `<${user.email}>`,
              subject: 'Complete your Tracman registration',
              text: mail.text(
                `Welcome to Tracman!  \n\nTo complete your registration, follow \
                this link and set your password:\n${env.url}/account/password/${token}\n\n\
                This link will expire at ${expiration_time_string}.  `
              ),
              html: mail.html(
                `<p>Welcome to Tracman! </p><p>To complete your registration, \
                follow this link and set your password:\
                <br><a href="${env.url}/account/password/${token}">\
                ${env.url}/account/password/${token}</a></p>\
                <p>This link will expire at ${expiration_time_string}. </p>`
              )
            }) )

          } catch (err) { reject(err) }
        })
      }

      try {

        // Invalid email
        if (!mw.validateEmail(req.body.email))
          throw Error('Invalid email')

        // Valid email
        else {

          // Check if somebody already has that email
          debug(`Searching for user with email ${req.body.email}...`)
          let existing_user = await User.findOne({'email': req.body.email})

          // User already exists
          if (existing_user && existing_user.auth.password)
            throw Error('User exists')

          // User exists but hasn't created a password yet
          else if (existing_user) {
            debug(`User ${existing_user.id} has email ${req.body.email} but doesn't have a password`)

            // Send another token
            await sendToken(existing_user)
            req.flash('warning', `A user with the email <u>${req.body.email}</u> has already been created, but hasn't set a password yet.  Another password creation link is being sent; check your inbox and spam folder.`)

          // Create user
          } else {
            debug(`User with email ${req.body.email} doesn't exist; creating one`)

            // Create new documents
            var user = new User()
            var map = new Map()
            var vehicle = new Vehicle()

            // Set map properties and save
            map.created = Date.now()
            map.vehicles = [vehicle]
            map.admins = [user]
            map.save()

            // Set vehicle properties and save
            vehicle.created = Date.now()
            vehicle.setter = user
            vehicle.map = map
            vehicle.save()

            // Set user properties and save
            user.created = Date.now()
            user.email = req.body.email
            user.sk32 = await new Promise((resolve, reject) => {
              debug('Creating sk32 for user...')
              crypto.randomBytes(32, (err, buf) => {
                if (err) throw err
                if (!buf)
                  throw new Error('Faild to create sk32 buf')
                else resolve(buf.toString('hex'))
              })
            })
            await user.save()

            // Send the token by email
            await sendToken(user)

            // Send response
            debug(`Successfully emailed new user ${user.id} instructions to continue`)
            req.flash('success',
              `An email has been sent to <u>${user.email}</u>. Check your \
              inbox and follow the link to complete your registration. (Your \
              registration link will expire in one hour). `
            )

          }

        }

      } catch (err) {

        // Display error to visitor
        switch (err.message) {

          case 'Invalid email':
            req.flash('danger', `The email you entered, <u>${req.body.email}</u> is invalid.`)
            break

          case 'User exists':
            req.flash('danger',`A user with that email (<u>${req.body.email}</u>) already exists.`)
            break

          case '550: Mailbox not found':
            req.flash('danger', `Couldn't find a mailbox at <u>${req.body.email}</u>.  Are you sure you typed that correctly?`)
            break

          default: mw.throwErr(err, req)
        }

        // Delete any documents and objects that were created
        try {
          user.remove()
          map.remove()
          vehicle.remove()
        } catch (err) { console.error(err) }


      } finally { res.redirect('/login') }

    })

  // Forgot password
  app.route('/login/forgot')

    // Check if user is already logged in
    // TODO: Write test for this situation
    .all((req, res, next) => {
      if (req.isAuthenticated()) loginCallback(req, res)
      else next()
    })

    // Show forgot password page
    .get((req, res, next) => {
      res.render('forgot', {email: req.query.email})
    })

    // Submitted forgot password form
    .post( async (req, res, next) => {

      // Invalid email
      if (!mw.validateEmail(req.body.email)) {
        debug(`Email ${req.body.email} was found invalid!`)
        req.flash('warning', `The email you entered, ${req.body.email} isn't valid.  Try again. `)
        res.redirect('/login/forgot')
        next()

      // Valid email
      } else {
        debug(`Email ${req.body.email} was found valid.`)

        // Check if somebody has that email
        try {
          let user = await User.findOne({'email': sanitize(req.body.email)})

          // No user with that email
          if (!user) {
            debug(`No user found with email ${req.body.email}; ignoring password request.`)
            // Don't let on that no such user exists, to prevent dictionary attacks
            req.flash('success',
              `If an account exists with the email <u>${req.body.email}</u>, \
              an email has been sent there with a password reset link. `
            )
            res.redirect('/login')

          // User with that email does exist
          } else {
            debug(`User ${user.id} found with that email.  Creating reset token...`)

            // Create reset token
            try {
              let [token, expires] = await user.createPassToken()

              // Figure out expiration time string
              debug(`Determining expiration time string for ${expires}...`)
              let expiration_time_string = (req.query.tz)
                ? moment(expires).utcOffset(req.query.tz).toDate().toLocaleTimeString(req.acceptsLanguages[0])
                : moment(expires).toDate().toLocaleTimeString(req.acceptsLanguages[0]) + ' UTC'

              // Email reset link
              try {
                await mail.send({
                  from: mail.noReply,
                  to: mail.to(user),
                  subject: 'Reset your Tracman password',
                  text: mail.text(
                    `Hi, \n\nDid you request to reset your Tracman password?  \
                    If so, follow this link to do so:\
                    \n${env.url}/account/password/${token}\n\n\
                    This link will expire at ${expiration_time_string}.  \n\n\
                    If you didn't initiate this request, just ignore this email. \n\n`
                  ),
                  html: mail.html(
                    `<p>Hi, </p><p>Did you request to reset your Tracman password?  \
                    If so, follow this link to do so:<br>\
                    <a href="${env.url}/account/password/${token}">\
                    ${env.url}/account/password/${token}</a>.  \
                    This link will expire at ${expiration_time_string}.  </p>\
                    <p>If you didn't initiate this request, just ignore this email. </p>`
                  )
                })
                req.flash(
                  'success',
                  `If an account exists with the email <u>${req.body.email}</u>, \
                  an email has been sent there with a password reset link.\
                  (Your reset link will expire in one hour.)`)
                res.redirect('/login')
              } catch (err) {
                debug(`Failed to send reset link to ${user.email}`)
                mw.throwErr(err, req)
                res.redirect('/login')
              }
            } catch (err) { return next(err) }
          }
        } catch (err) {
          debug(`Failed to check for if somebody has that email (in reset request)!`)
          mw.throwErr(err, req)
          res.redirect('/login/forgot')
        }

      }

    })

  // Android
  app.post('/login/app', passport.authenticate('local'), appLoginCallback)

  // Token-based (android social login)
  app.get(['/login/app/google', '/auth/google/idtoken'], passport.authenticate('google-token'), appLoginCallback)
  // app.get('/login/app/facebook', passport.authenticate('facebook-token'), appLoginCallback);
  // app.get('/login/app/twitter', passport.authenticate('twitter-token'), appLoginCallback);

  // Social
  app.get('/login/:service', async (req, res, next) => {
    let service = req.params.service
    let sendParams = (service === 'google') ? {scope: ['https://www.googleapis.com/auth/userinfo.profile']} : null

    // Social login
    if (!req.user) {
      debug(`Attempting to login with ${service} with params: ${JSON.stringify(sendParams)}...`)
      passport.authenticate(service, sendParams)(req, res, next)

    // Connect social account
    } else if (!req.user.auth[service]) {
      debug(`Attempting to connect ${service} account...`)
      passport.authorize(service, sendParams)(req, res, next)

    // Disconnect social account
    } else {
      debug(`Attempting to disconnect ${service} account...`)

      // Make sure the user has a password before they disconnect their google login account
      // This is because login used to only be through google, and some people might not have
      // set passwords yet...
      if (!req.user.auth.password && service === 'google') {
        req.flash(
          'warning',
          `Hey, you need to <a href="/account/password">set a password</a> \
          before you can disconnect your google account.  Otherwise, you \
          won't be able to log in! `
        )
        res.redirect('/settings')
      } else {
        try {
          req.user.auth[service] = undefined
          await req.user.save()
          req.flash('success', `${mw.capitalize(service)} account disconnected. `)
          res.redirect('/settings')
        } catch (err) {
          debug(`Failed to save user after disconnecting ${service} account!`)
          mw.throwErr(err, req)
          res.redirect('/settings')
        }
      }
    }
  })
  app.get('/login/google/cb', passport.authenticate('google', loginOutcome), loginCallback)
  app.get('/login/facebook/cb', passport.authenticate('facebook', loginOutcome), loginCallback)
  app.get('/login/twitter/cb', passport.authenticate('twitter', loginOutcome), loginCallback)

}
