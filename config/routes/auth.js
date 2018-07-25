'use strict' /* global sendToken */

const mw = require('../middleware')
const mail = require('../mail')
const User = require('../models').user
const Map = require('../models').map
const Vehicle = require('../models').vehicle
const crypto = require('crypto')
const util = require('util')
const setTimeoutPromise = util.promisify(setTimeout)
const moment = require('moment')
const sanitize = require('mongo-sanitize')
const slugify = require('slug')
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
    if (req.user) {
      debug(`App login succeeded`)
      res.send(req.user)
    } else {
      debug(`App login failed`)
      const err = Error('Unauthorized')
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
      else res.render('login', {
        active: 'login',
      })
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
            const [token, expires] = await user.createPassToken()
            debug(`Created password token for user ${user.id}`)

            // Delete user if token expires without password being set
            setTimeoutPromise(1000*60*60).then( () => {
              debug(`Deleting abandoned account ${user.id}...`)
              user.remove()
            }).catch(console.error)

            // Figure out expiration time string
            debug(`Determining expiration time string for ${expires}...`)
            const expiration_time_string = (req.query.tz)
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
          const existing_user = await User.findOne({'email': req.body.email})

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
            //var map = new Map()
            // var vehicle = new Vehicle()

            // Set map properties and save
            //map.created = Date.now()
            //map.vehicles = [vehicle]
            //map.admins = [req.body.email]
            //map.name = `${user.name} map`

            // map.slug = await new Promise( (resolve, reject) => {
              // debug(`Creating new slug for map...`)

              // Recursive IIFE to find unused slug
              // ;( async function checkSlug (s) {
              //   try {
              //     // Sanitize and slugify
              //     s = slugify(sanitize(s))
              //     debug(`Checking to see if slug ${s} is taken...`)

              //     // Slug in use
              //     if (await Map.findOne({slug: s})) {
              //       debug(`Slug ${s} is taken; generating another digit...`)
              //       // Add a random digit
              //       crypto.randomBytes(1, (err, buf) => {
              //         if (err) return reject(err)
              //         if (!buf)
              //           return reject('crypto.randomBytes failed to generate buf!')
              //         else
              //           // Recurse by checking the newly generated slug
              //           checkSlug(s+buf.toString('hex'))
              //       })

              //     // Unique slug: proceed
              //     } else {
              //       debug(`Slug ${s} is unique`)
              //       resolve(s)
              //     }

              //   } catch (err) { reject(err) }

              // // Initial slug argument to IIFE is the first part of the email
              // })( user.name )

            // })

            // Set vehicle properties and save
            // vehicle.created = Date.now()
            // vehicle.setter = user
            // vehicle.map = map

            // Set user properties and save
            user.created = Date.now()
            user.name = req.body.email.substring(0, req.body.email.indexOf('@'))
            user.email = req.body.email
            user.sk32 = await new Promise((resolve, reject) => {
              debug('Creating sk32 for user...')
              crypto.randomBytes(32, (err, buf) => {
                if (err) throw err
                if (!buf)
                  throw Error('Faild to create sk32 buf')
                else resolve(buf.toString('hex'))
              })
            })

            // Send token and save docs
            await Promise.all([
              sendToken(user),
              user.save(),
              // vehicle.save(),
              // map.save(),
            ])

            // Send response
            debug(`Successfully emailed new user ${user.id} instructions to continue`)
            req.flash('success',
              `An email has been sent to <u>${user.email}</u>. Check your inbox and follow the link to complete your registration. (Your registration link will expire in one hour). `
            )

          }

        }

      } catch (err) {

        // Display error to visitor
        if (err.message==='Invalid email')
          req.flash('danger', `The email you entered, <u>${req.body.email}</u> is invalid.`)
        else if (err.message==='User exists')
          req.flash('danger',`A user with that email (<u>${req.body.email}</u>) already exists.`)
        else if (err.message.slice(0, 15)==='Can\'t send mail')
          req.flash('danger', `Couldn't send mail to <u>${req.body.email}</u>.  Are you sure you typed that correctly?`)
        else mw.throwErr(err, req)

        // Delete any documents and objects that were created
        try {
          await Promise.all( [
            user.remove(),
            map.remove(),
            vehicle.remove(),
          // Also wait for rejected promises
          // https://stackoverflow.com/a/36115549/3006854
          ].map(p => p.catch(e => e)) )
        } catch (err) {
          // Ignore attempts to remove objects that don't exist
          if (!err.message===`Cannot read property 'remove' of undefined`)
            console.error(err)
        }


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
      try {

        // Invalid email
        if (!mw.validateEmail(req.body.email))
          throw Error('Invalid email')

        // Valid email
        else {
          debug(`Email ${req.body.email} is valid.`)

          // Check if somebody has that email
          const user = await User.findOne({'email': sanitize(req.body.email)})

          // No user with that email
          if (!user)
            debug(`No user found with email ${req.body.email}; ignoring password request.`)

          // User with that email does exist
          else {
            debug(`User ${user.id} found with that email.  Creating reset token...`)

            // Create reset token
            const [token, expires] = await user.createPassToken()

            // Figure out expiration time string
            debug(`Determining expiration time string for ${expires}...`)
            const expiration_time_string = (req.query.tz)
              ? moment(expires).utcOffset(req.query.tz).toDate().toLocaleTimeString(req.acceptsLanguages[0])
              : moment(expires).toDate().toLocaleTimeString(req.acceptsLanguages[0]) + ' UTC'

            // Email reset link
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

          }

          // Respond
          req.flash(
            'success',
            `If an account exists with the email <u>${req.body.email}</u>, \
            an email has been sent there with a password reset link.\
            (Your reset link will expire in one hour.)`)
          res.redirect('/login')

        }

      } catch (err) {

        // Display error to visitor
        if (err.message==='Invalid email')
          req.flash('warning', `The email you entered, ${req.body.email} isn't valid.  Try again. `)
        else mw.throwError(err, req)

        // Respond
        res.redirect(`/login/forgot?email=${req.body.email}`)

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
    const sendParams = (req.params.service === 'google') ? {scope: ['https://www.googleapis.com/auth/userinfo.profile']} : null

    // Social login
    if (!req.user) {
      debug(`Attempting to login with ${req.params.service} with params: ${JSON.stringify(sendParams)}...`)
      passport.authenticate(req.params.service, sendParams)(req, res, next)

    // Connect social account
    } else if (!req.user.auth[req.params.service]) {
      debug(`Attempting to connect ${req.params.service} account...`)
      passport.authorize(req.params.service, sendParams)(req, res, next)

    // Disconnect social account
    } else {
      debug(`Attempting to disconnect ${req.params.service} account...`)

      // Make sure the user has a password before they disconnect their google login account
      // This is because login used to only be through google, and some people might not have
      // set passwords yet...
      if (!req.user.auth.password && req.params.service === 'google') {
        req.flash(
          'warning',
          `Hey, you need to <a href="/account/password">set a password</a> \
          before you can disconnect your google account.  Otherwise, you \
          won't be able to log in! `
        )
        res.redirect('/settings')
      } else {
        try {
          req.user.auth[req.params.service] = undefined
          await req.user.save()
          req.flash('success', `${mw.capitalize(req.params.service)} account disconnected. `)
          res.redirect('/settings')
        } catch (err) {
          debug(`Failed to save user after disconnecting ${req.params.service} account!`)
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
