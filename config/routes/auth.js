'use strict'

const mw = require('../middleware.js')
const mail = require('../mail.js')
const User = require('../models.js').user
const crypto = require('crypto')
const moment = require('moment')
const slugify = require('slug')
const debug = require('debug')('tracman-routes-auth')
const env = require('../env/env.js')

module.exports = (app, passport) => {

  // Methods for success and failure
  const loginOutcome = {
    failureRedirect: '/login',
    failureFlash: true
  }
  const loginCallback = (req, res) => {
    debug(`Login callback called... redirecting to ${req.session.next}`)
    req.flash(req.session.flashType, req.session.flashMessage)
    req.session.flashType = undefined
    req.session.flashMessage = undefined
    res.redirect(req.session.next || '/map')
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
    req.flash('success', `You have been logged out.`)
    res.redirect(req.session.next || '/')
  })

  // Signup
  app.route('/signup')
    .get((req, res) => {
      res.redirect('/login#signup')
    })
    .post((req, res, next) => {

      // Send token and alert user
      function sendToken(user) {
        debug(`sendToken() called for user ${user.id}`)

        // Create a new password token
        user.createPassToken()
        .then( (token, expires) => {
            debug(`Created password token for user ${user.id} successfully`)

            // Figure out expiration time
            let expirationTimeString = (req.query.tz)
              ? moment(expires).utcOffset(req.query.tz).toDate().toLocaleTimeString(req.acceptsLanguages[0])
              : moment(expires).toDate().toLocaleTimeString(req.acceptsLanguages[0]) + ' UTC'

            // Email the instructions to continue
            debug(`Emailing new user ${user.id} at ${user.email} instructions to create a password...`)
            mail.send({
              from: mail.noReply,
              to: `<${user.email}>`,
              subject: 'Complete your Tracman registration',
              text: mail.text(
                `Welcome to Tracman!  \n\nTo complete your registration, follow \
                this link and set your password:\n${env.url}/settings/password/${token}\n\n\
                This link will expire at ${expirationTimeString}.  `
              ),
              html: mail.html(
                `<p>Welcome to Tracman! </p><p>To complete your registration, \
                follow this link and set your password:\
                <br><a href="${env.url}/settings/password/${token}">\
                ${env.url}/settings/password/${token}</a></p>\
                <p>This link will expire at ${expirationTimeString}. </p>`
              )
            })
            .then(() => {
              debug(`Successfully emailed new user ${user.id} instructions to continue`)
              req.flash('success',
                `An email has been sent to <u>${user.email}</u>. Check your \
                inbox and follow the link to complete your registration. (Your \
                registration link will expire in one hour). `
              )
              res.redirect('/login')
            })
            .catch((err) => { switch (err.responseCode) {

              // Mailbox doesn't exist
              case 550: {
                debug(`Failed to email new user ${user.id} instructions to create a password because the mailbox for ${user.email} wasn't found. `)

                // Remove user
                user.remove().catch( (err) => {
                  console.error(`Failed to remove new user ${user.id}, with a nonexistant email of ${user.email}:\n`,err.stack)
                })

                // Redirect back
                req.flash('danger', `Mailbox for <u>${user.email}</u> not found.  Did you enter that correctly?`)
                res.redirect('/login#signup')

                break

              // Other error
              } default: {
                debug(`Failed to email new user ${user.id} instructions to create a password!`)
                mw.throwErr(err, req)
                res.redirect('/login#signup')
              }

            } })
        })
        .catch( (err) => {
          debug(`Error creating password token for user ${user.id}!`)
          mw.throwErr(err, req)
          res.redirect('/login#signup')
        })

      }

      // Validate email
      req.checkBody('email', 'Please enter a valid email address.').isEmail()

      // Check if somebody already has that email
      debug(`Searching for user with email ${req.body.email}...`)
      User.findOne({'email': req.body.email})
      .then((user) => {

        // User already exists
        if (user && user.auth.password) {
          debug(`User ${user.id} has email ${req.body.email} and has a password`)
          req.flash('warning',
            `A user with that email already exists!  If you forgot your password, \
            you can <a href="/login/forgot?email=${req.body.email}">reset it here</a>.`
          )
          res.redirect('/login#login')
          next()

        // User exists but hasn't created a password yet
        } else if (user) {
          debug(`User ${user.id} has email ${req.body.email} but doesn't have a password`)

          // Send another token
          sendToken(user)

        // Create user
        } else {
          debug(`User with email ${req.body.email} doesn't exist; creating one`)

          let email = req.body.email

          user = new User()
          user.created = Date.now()
          user.email = email
          user.slug = slugify(email.substring(0, email.indexOf('@')))

          // Generate unique slug
          const slug = new Promise((resolve, reject) => {
            debug(`Creating new slug for user...`);

            (function checkSlug (s, cb) {
              debug(`Checking to see if slug ${s} is taken...`)
              User.findOne({slug: s})
              .then((existingUser) => {
                // Slug in use: generate a random one and retry
                if (existingUser) {
                  debug(`Slug ${s} is taken; generating another...`)
                  crypto.randomBytes(6, (err, buf) => {
                    if (err) {
                      debug('Failed to create random bytes for slug!')
                      mw.throwErr(err, req)
                      reject()
                    }
                    if (buf) {
                      checkSlug(buf.toString('hex'), cb)
                    }
                  })

                // Unique slug: proceed
                } else {
                  debug(`Slug ${s} is unique`)
                  cb(s)
                }
              })
              .catch((err) => {
                debug('Failed to create slug!')
                mw.throwErr(err, req)
                reject()
              })
            })(user.slug, (newSlug) => {
              debug(`Successfully created slug: ${newSlug}`)
              user.slug = newSlug
              resolve()
            })
          })

          // Generate sk32
          const sk32 = new Promise((resolve, reject) => {
            debug('Creating sk32 for user...')
            crypto.randomBytes(32, (err, buf) => {
              if (err) {
                debug('Failed to create sk32!')
                mw.throwErr(err, req)
                reject()
              }
              if (buf) {
                user.sk32 = buf.toString('hex')
                debug(`Successfully created sk32: ${user.sk32}`)
                resolve()
              }
            })
          })

          // Save user and send the token by email
          Promise.all([slug, sk32])
          //.then(() => { user.save() })
          .then(() => { sendToken(user) })
          .catch((err) => {
            debug('Failed to save user after creating slug and sk32!')
            mw.throwErr(err, req)
            res.redirect('/login#signup')
          })
        }
      })
      .catch((err) => {
        debug(`Failed to check if somebody already has the email ${req.body.email}`)
        mw.throwErr(err, req)
        res.redirect('/login#signup')
      })
    })

  // Forgot password
  app.route('/login/forgot')

    // Check if user is already logged in
    .all((req, res, next) => {
      if (req.isAuthenticated()) loginCallback(req, res)
      else next()
    })

    // Show forgot password page
    .get((req, res, next) => {
      res.render('forgot', {email: req.query.email})
    })

    // Submitted forgot password form
    .post((req, res, next) => {
      // Validate email
      req.checkBody('email', 'Please enter a valid email address.').isEmail()

      // Check if somebody has that email
      User.findOne({'email': req.body.email})
        .then((user) => {
          // No user with that email
          if (!user) {
            // Don't let on that no such user exists, to prevent dictionary attacks
            req.flash('success',
              `If an account exists with the email <u>${req.body.email}</u>, \
              an email has been sent there with a password reset link. `
            )
            res.redirect('/login')

          // User with that email does exist
          } else {

            // Create reset token
            user.createPassToken()
            .then( (token) => {

              // Email reset link
              mail.send({
                from: mail.noReply,
                to: mail.to(user),
                subject: 'Reset your Tracman password',
                text: mail.text(
                  `Hi, \n\nDid you request to reset your Tracman password?  \
                  If so, follow this link to do so:\
                  \n${env.url}/settings/password/${token}\n\n\
                  If you didn't initiate this request, just ignore this email. `
                ),
                html: mail.html(
                  `<p>Hi, </p><p>Did you request to reset your Tracman password?  \
                  If so, follow this link to do so:<br>\
                  <a href="${env.url}/settings/password/${token}">\
                  ${env.url}/settings/password/${token}</a></p>\
                  <p>If you didn't initiate this request, just ignore this email. </p>`
                )
              })
              .then(() => {
                req.flash(
                  'success',
                  `If an account exists with the email <u>${req.body.email}</u>, \
                  an email has been sent there with a password reset link. `)
                res.redirect('/login')
              })
              .catch((err) => {
                debug(`Failed to send reset link to ${user.email}`)
                mw.throwErr(err, req)
                res.redirect('/login')
              })
            })
            .catch( (err) => {
              return next(err)
            })
          }
        })
        .catch((err) => {
          debug(`Failed to check for if somebody has that email (in reset request)!`)
          mw.throwErr(err, req)
          res.redirect('/login/forgot')
        })

    })

  // Android
  app.post('/login/app', passport.authenticate('local'), appLoginCallback)

  // Token-based (android social)
  app.get(['/login/app/google', '/auth/google/idtoken'], passport.authenticate('google-token'), appLoginCallback)
  // app.get('/login/app/facebook', passport.authenticate('facebook-token'), appLoginCallback);
  // app.get('/login/app/twitter', passport.authenticate('twitter-token'), appLoginCallback);

  // Social
  app.get('/login/:service', (req, res, next) => {
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
          `Hey, you need to <a href="/settings/password">set a password</a> \
          before you can disconnect your google account.  Otherwise, you \
          won't be able to log in! `
        )
        res.redirect('/settings')
      } else {
        req.user.auth[service] = undefined
        req.user.save()
        .then(() => {
          req.flash('success', `${mw.capitalize(service)} account disconnected. `)
          res.redirect('/settings')
        })
        .catch((err) => {
          debug(`Failed to save user after disconnecting ${service} account!`)
          mw.throwErr(err, req)
          res.redirect('/settings')
        })
      }
    }
  })
  app.get('/login/google/cb', passport.authenticate('google', loginOutcome), loginCallback)
  app.get('/login/facebook/cb', passport.authenticate('facebook', loginOutcome), loginCallback)
  app.get('/login/twitter/cb', passport.authenticate('twitter', loginOutcome), loginCallback)
}
