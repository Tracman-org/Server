'use strict'

const slug = require('slug')
const xss = require('xss')
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
                To confirm your email, follow this link:\n${env.url}/account/email/${token}. `
              ),
              html: mail.html(
                `<p>A request has been made to change your Tracman email address.  \
                If you did not initiate this request, please disregard it.  </p>\
                <p>To confirm your email, follow this link:\
                <br><a href="${env.url}/account/email/${token}">\
                ${env.url}/account/email/${token}</a>. </p>`
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
      await User.findByIdAndUpdate(req.user.id,
        {$set: { isPro: true }})
      req.flash('success', 'You have been signed up for pro. ')
      res.redirect('/settings')
    } catch (err) {
      mw.throwErr(err, req)
      res.redirect('/settings/pro')
    }
  })

// Redirects for URLs that moved to /account
router.route('/password')
  .all((req,res)=>{
    res.redirect(307, '/account/password')
  })
router.route('/password/:token')
  .all((req,res)=>{
    res.redirect(307, `/account/password/${req.params.token}`)
  })
router.route('/email/:token')
  .all((req,res)=>{
    res.redirect(307, `/account/email/${req.params.token}`)
  })

module.exports = router
