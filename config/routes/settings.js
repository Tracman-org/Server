'use strict'

const slug = require('slug')
const xss = require('xss')
const zxcvbn = require('zxcvbn')
const moment = require('moment')
const mw = require('../middleware.js')
const User = require('../models.js').user
const mail = require('../mail.js')
const env = require('../env/env.js')
const debug = require('debug')('tracman-routes-settings')
const router = require('express').Router()

// Settings form
router.route('/')
  .all(mw.ensureAuth, (req, res, next) => {
    next()
  })

  // Get settings form
  .get((req, res) => {
    res.render('settings', {active: 'settings'})
  })

  // Set new settings
  .post( async (req, res, next) => {
    // Validate email
    const checkEmail = new Promise( async (resolve, reject) => {
      // Check validity
      if (!mw.validateEmail(req.body.email)) {
        req.flash('warning', `<u>${req.body.email}</u> is not a valid email address.  `)
        resolve()

      // Check if unchanged
      } else if (req.user.email === req.body.email) resolve()

      // Check uniqueness
      else {
        try {
          let existingUser = await User.findOne({ email: req.body.email })

          // Not unique!
          if (existingUser && existingUser.id !== req.user.id) {
            debug('Email not unique!')
            req.flash('warning',
              `That email, <u>${req.body.email}</u>, is already in use by another user! `
            )
            resolve()

          // It's unique
          } else {
            debug('Email is unique')
            req.user.newEmail = req.body.email

            // Create token
            debug(`Creating email token...`)
            let token = await req.user.createEmailToken()

            // Send token to user by email
            debug(`Mailing new email token to ${req.body.email}...`)
            await mail.send({
              to: `"${req.user.name}" <${req.body.email}>`,
              from: mail.noReply,
              subject: 'Confirm your new email address for Tracman',
              text: mail.text(
                `A request has been made to change your Tracman email address.  \
                If you did not initiate this request, please disregard it.  \n\n\
                To confirm your email, follow this link:\n${env.url}/settings/email/${token}. `
              ),
              html: mail.html(
                `<p>A request has been made to change your Tracman email address.  \
                If you did not initiate this request, please disregard it.  </p>\
                <p>To confirm your email, follow this link:\
                <br><a href="${env.url}/settings/email/${token}">\
                ${env.url}/settings/email/${token}</a>. </p>`
              )
            })

            req.flash('warning',
              `An email has been sent to <u>${req.body.email}</u>.  Check your inbox to confirm your new email address. `
            )
            resolve()
          }
        } catch (err) { reject() }
      }
    })

    // Validate slug
    const checkSlug = new Promise( async (resolve, reject) => {
      // Check existence
      if (req.body.slug === '') {
        req.flash('warning', `You must supply a slug.  `)
        resolve()

      // Check if unchanged
      } else if (req.user.slug === slug(xss(req.body.slug))) resolve()

      // Check uniqueness
      else {
        try {
          let existingUser = await User.findOne({ slug: req.body.slug })

          // Not unique!
          if (existingUser && existingUser.id !== req.user.id) {
            req.flash( 'warning',
            `That slug, <u>${req.body.slug}</u>, is already in use by another user! `
            )

          // It's unique
          } else req.user.slug = slug(xss(req.body.slug))

          resolve()
        } catch (err) { reject() }
      }
    })

    // Set settings when done
    try {
      await Promise.all([checkEmail, checkSlug])
      debug('Setting settings... ')

      // Set values
      req.user.name = xss(req.body.name)
      req.user.settings = {
        units: req.body.units,
        defaultMap: req.body.map,
        defaultZoom: req.body.zoom,
        showScale: !!(req.body.showScale),
        showSpeed: !!(req.body.showSpeed),
        showAlt: !!(req.body.showAlt),
        showStreetview: !!(req.body.showStreet),
        marker: req.body.marker
      }

      // Save user and send response
      debug(`Saving new settings for user ${req.user.name}...`)
      await req.user.save()
      debug(`DONE!  Redirecting user...`)
      req.flash('success', 'Settings updated. ')

    } catch (err) { mw.throwErr(err, req) }
    finally { res.redirect('/settings') }
  })

// Delete account
router.get('/delete', async (req, res) => {
  try {
    await User.findByIdAndRemove(req.user)
    req.flash('success', 'Your account has been deleted. ')
    res.redirect('/')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect('/settings')
  }
})

// Confirm email address
router.get('/email/:token', mw.ensureAuth, async (req, res, next) => {
  // Check token
  if (req.user.emailToken === req.params.token) {
    try {
      // Set new email
      req.user.email = req.user.newEmail

      // Delete token and newEmail
      req.user.emailToken = undefined
      req.user.newEmail = undefined

      await req.user.save()

      // Report success
      req.flash('success', `Your email has been set to <u>${req.user.email}</u>. `)
      res.redirect('/settings')

    } catch (err) {
      mw.throwErr(err, req)
      res.redirect('/settings')
    }

  // Invalid token
  } else {
    req.flash('danger', 'Email confirmation token is invalid. ')
    res.redirect('/settings')
  }
})

// Set password
router.route('/password')
  .all(mw.ensureAuth, (req, res, next) => {
    next()
  })

  // Email user a token, proceed at /password/:token
  .get( async (req, res, next) => {
    // Create token for password change
    try {
      let [token, expires] = await req.user.createPassToken()
      // Figure out expiration time
      let expirationTimeString = (req.query.tz)
        ? moment(expires).utcOffset(req.query.tz).toDate().toLocaleTimeString(req.acceptsLanguages[0])
        : moment(expires).toDate().toLocaleTimeString(req.acceptsLanguages[0]) + ' UTC'

      // Confirm password change request by email.
      return await mail.send({
        to: mail.to(req.user),
        from: mail.noReply,
        subject: 'Request to change your Tracman password',
        text: mail.text(
          `A request has been made to change your tracman password.  \
          If you did not initiate this request, please contact support at keith@tracman.org.  \
          \n\nTo change your password, follow this link:\n\
          ${env.url}/settings/password/${token}. \n\n\
          This request will expire at ${expirationTimeString}. `
        ),
        html: mail.html(
          `<p>A request has been made to change your tracman password.  \
          If you did not initiate this request, please contact support at \
          <a href="mailto:keith@tracman.org">keith@tracman.org</a>.  </p>\
          <p>To change your password, follow this link:\
          <br><a href="${env.url}/settings/password/${token}">\
          ${env.url}/settings/password/${token}</a>. </p>\
          <p>This request will expire at ${expirationTimeString}. </p>`
        )
      })

      // Alert user to check email.
      req.flash('success',
        `An link has been sent to <u>${req.user.email}</u>.  \
        Click on the link to complete your password change.  \
        This link will expire in one hour (${expirationTimeString}). `
      )
    } catch (err) {
      mw.throwErr(err, req)
    } finally {
      res.redirect((req.user) ? '/settings' : '/login')
    }
  })

router.route('/password/:token')

  // Check token
  .all( async (req, res, next) => {
    debug('/settings/password/:token .all() called')
    try {
      let user = await User
        .findOne({'auth.passToken': req.params.token})
        .where('auth.passTokenExpires').gt(Date.now())

      if (!user) {
        debug('Bad token')
        req.flash('danger', 'Password reset token is invalid or has expired. ')
        res.redirect((req.isAuthenticated) ? '/settings' : '/login')
      } else {
        debug('setting passwordUser')
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
    debug('/settings/password/:token .get() called')
    res.render('password')
  })

  // Set new password
  .post( async (req, res, next) => {
    debug('/settings/password/:token .post() called')

    // Validate password strength
    let zxcvbnResult = zxcvbn(req.body.password)
    if (zxcvbnResult.crack_times_seconds.online_no_throttling_10_per_second < 864000) { // Less than ten days
      req.flash( 'danger',
				`That password could be cracked in ${zxcvbnResult.crack_times_display.online_no_throttling_10_per_second}!  Come up with a more complex password that would take at least 10 days to crack. `
			)
      res.redirect(`/settings/password/${req.params.token}`)
    } else {

      // Create hashed password and save to db
      try {
        await res.locals.passwordUser.generateHashedPassword(req.body.password)

        // User changed password
        if (req.user) {
          debug('User saved password')
          req.flash('success', 'Your password has been changed. ')
          res.redirect('/settings')

        // New user created password
        } else {
          debug('New user created password')
          req.flash('success', 'Password set.  You can use it to log in now. ')
          res.redirect('/login')
        }

      } catch (err) {
        debug('Error creating hashed password and saving to db')
        mw.throwErr(err, req)
        res.redirect(`/settings/password/${req.params.token}`)
      }

    }
  })

// Tracman pro
router.route('/pro')
  .all(mw.ensureAuth, (req, res, next) => {
    next()
  })

  // Get info about pro
  .get((req, res, next) => {
    res.render('pro')
  })

  // Join Tracman pro
  .post( async (req, res) => {
    try {
      let user = await User.findByIdAndUpdate(req.user.id,
        {$set: { isPro: true }})
      req.flash('success', 'You have been signed up for pro. ')
      res.redirect('/settings')
    } catch (err) {
      mw.throwErr(err, req)
      res.redirect('/settings/pro')
    }
  })

module.exports = router
