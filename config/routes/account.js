'use strict'

const mw = require('../middleware')
const User = require('../models').user
const mail = require('../mail')
const env = require('../env/env')
const sanitize = require('mongo-sanitize')
const zxcvbn = require('zxcvbn')
const moment = require('moment')
const debug = require('debug')('tracman-routes-account')
const router = require('express').Router()


// Confirm email address
router.get('/email/:token', mw.ensureAuth, async (req, res, next) => {
  debug(`GET /email/:token=${req.params.token}`)
  // Check token
  if (req.user.emailToken === req.params.token) {
    try {
      const old_email = req.user.email

      // Set new email
      req.user.email = req.user.newEmail

      // Delete token and newEmail
      req.user.emailToken = undefined
      req.user.newEmail = undefined

      // Modify maps this user is admining
      await Map.find({
        admins: old_email,
      }).forEach( (map) => {
        map.admins
          .splice(map.admins.indexOf(old_email), 1)
          .push(req.user.newEmail)
          .save()
      })

      // Save new user and report success
      await req.user.save()
      req.flash('success', `Your email has been set to <u>${req.user.email}</u>. `)
      res.redirect('/settings')

    } catch (err) {
      mw.throwErr(err, req)
      res.redirect('/settings/user')
    }

  // Invalid token
  } else {
    req.flash('danger', 'Email confirmation token is invalid. ')
    res.redirect('/settings')
  }
})

// Set password
router.route('/password')
  .all(mw.ensureAuth)

  // Email user a token, proceed at /password/:token
  .get( async (req, res, next) => {
    debug(`GET /password`)
    // Create token for password change
    try {
      const [token, expires] = await req.user.createPassToken()
      // Figure out expiration time
      const expirationTimeString = (req.query.tz)
        ? moment(expires).utcOffset(req.query.tz).toDate().toLocaleTimeString(req.acceptsLanguages[0])
        : moment(expires).toDate().toLocaleTimeString(req.acceptsLanguages[0]) + ' UTC'

      // Alert user to check email.
      req.flash('success',
        `An link has been sent to <u>${req.user.email}</u>.  \
        Click on the link to complete your password change.  \
        This link will expire in one hour (${expirationTimeString}). `
      )

      // Confirm password change request by email.
      return await mail.send({
        to: mail.to(req.user),
        from: mail.noReply,
        subject: 'Request to change your Tracman password',
        text: mail.text(
          `A request has been made to change your tracman password.  \
          If you did not initiate this request, please contact support at keith@tracman.org.  \
          \n\nTo change your password, follow this link:\n\
          ${env.url}/account/password/${token}. \n\n\
          This request will expire at ${expirationTimeString}. `
        ),
        html: mail.html(
          `<p>A request has been made to change your tracman password.  \
          If you did not initiate this request, please contact support at \
          <a href="mailto:keith@tracman.org">keith@tracman.org</a>.  </p>\
          <p>To change your password, follow this link:\
          <br><a href="${env.url}/account/password/${token}">\
          ${env.url}/account/password/${token}</a>. </p>\
          <p>This request will expire at ${expirationTimeString}. </p>`
        )
      })

    } catch (err) {
      mw.throwErr(err, req)
    } finally {
      req.logout()
      res.redirect('/login')
    }
  })

router.route('/password/:token')

  // Check token
  .all( async (req, res, next) => {
    debug(`ALL /account/password/:token=${req.params.token}`)
    try {
      const user = await User
        .findOne({'auth.passToken': sanitize(req.params.token)})
        .where('auth.passTokenExpires').gt(Date.now())

      if (!user) {
        debug('Bad token')
        req.flash('danger', 'Password reset token is invalid or has expired. ')
        res.redirect((req.isAuthenticated) ? '/settings' : '/login')
      } else {
        debug(`Password reset token is valid and unexpired.  Saving this still-logged-out user as res.locals.passwordUser...`)
        res.locals.passwordUser = user
        next()
      }

    } catch (err) {
      mw.throwErr(err, req)
      res.redirect('/password')
    }

  })

  // Show password change form
  .get((req, res) => {
    debug(`GET /account/password/:token=${req.params.token}`)
    res.render('password')
  })

  // Set new password
  .post( async (req, res, next) => {
    debug(`POST /account/password/:token=${req.params.token}`)

    // Validate password strength
    const zxcvbnResult = zxcvbn(req.body.password)
    if (zxcvbnResult.crack_times_seconds.online_no_throttling_10_per_second < 864000) { // Less than ten days
      req.flash( 'danger',
				`That password could be cracked in ${zxcvbnResult.crack_times_display.online_no_throttling_10_per_second}!  Come up with a more complex password that would take at least 10 days to crack. `
			)
      res.redirect(`/account/password/${req.params.token}`)
    } else {

      // Create hashed password and save to db
      try {
        await res.locals.passwordUser.generateHashedPassword(req.body.password)

        // User changed password
        if (req.user) {
          debug(`${res.locals.passwordUser.email} set new password`)
          req.flash('success', 'Your password has been changed. ')
          res.redirect('/settings')

        // New user created password
        } else {
          debug(`New user created: ${res.locals.passwordUser.email}`)
          req.flash('success', 'Password set.  You can use it to log in now. ')
          res.redirect('/login')
        }

      } catch (err) {
        debug('Error creating hashed password for ${res.locals.passwordUser.email} and saving to db')
        mw.throwErr(err, req)
        res.redirect(`/account/password/${req.params.token}`)
      }

    }
  })

module.exports = router
