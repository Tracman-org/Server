'use strict'

const slug = require('slug')
const xss = require('xss')
const sanitize = require('mongo-sanitize')
const mw = require('../middleware')
const mail = require('../mail')
const env = require('../env/env')
const debug = require('debug')('tracman-routes-settings')
const User = require('../models').user
const Map = require('../models').map
const router = require('express').Router()

// Settings index
router.get('/', mw.ensureAuth, async (req, res) => {
  res.render('settings/index', {
    active: 'settings',
  })
})

// User settings
router.route('/user')
  .all(mw.ensureAuth)

  // Show user settings page
  .get( (req, res) => {
    res.render('settings/user', {
      active: 'settings',
    })
  })

  // TODO: Set user settings
  // .post( (req, res) => {

  //   // Validate email
  //   const checkEmail = new Promise( async (resolve, reject) => {

  //     // Check validity
  //     if (!mw.validateEmail(req.body.email)) {
  //       req.flash('warning', `<u>${req.body.email}</u> is not a valid email address.  `)
  //       resolve()

  //     // Check if unchanged
  //     } else if (req.user.email === req.body.email) resolve()

  //     // Check uniqueness
  //     else {
  //       try {
  //         let existingUser = await User.findOne({ email: req.body.email })

  //         // Not unique!
  //         if (existingUser && existingUser.id !== req.user.id) {
  //           debug('Email not unique!')
  //           req.flash('warning',
  //             `That email, <u>${req.body.email}</u>, is already in use by another user! `
  //           )
  //           resolve()

  //         // It's unique
  //         } else {
  //           debug('Email is unique')
  //           req.user.newEmail = req.body.email

  //           // Create token
  //           debug(`Creating email token...`)
  //           let token = await req.user.createEmailToken()

  //           // Send token to user by email
  //           debug(`Mailing new email token to ${req.body.email}...`)
  //           await mail.send({
  //             to: `"${req.user.name}" <${req.body.email}>`,
  //             from: mail.noReply,
  //             subject: 'Confirm your new email address for Tracman',
  //             text: mail.text(
  //               `A request has been made to change your Tracman email address.  \
  //               If you did not initiate this request, please disregard it.  \n\n\
  //               To confirm your email, follow this link:\n${env.url}/account/email/${token}. `
  //             ),
  //             html: mail.html(
  //               `<p>A request has been made to change your Tracman email address.  \
  //               If you did not initiate this request, please disregard it.  </p>\
  //               <p>To confirm your email, follow this link:\
  //               <br><a href="${env.url}/account/email/${token}">\
  //               ${env.url}/account/email/${token}</a>. </p>`
  //             )
  //           })

  //           req.flash('warning',
  //             `An email has been sent to <u>${req.body.email}</u>.  Check your inbox to confirm your new email address. `
  //           )
  //           resolve()
  //         }
  //       } catch (err) { reject() }
  //     }
  //   })

  //   // Set settings when done
  //   try {
  //     await checkEmail
  //     debug('Setting user settings... ')

  //     // Set values
  //     req.user.name = xss(req.body.name)

  //     // Save user and send response
  //     debug(`Saving new settings for user ${req.user.name}...`)
  //     await req.user.save()
  //     debug(`DONE!  Redirecting user...`)
  //     req.flash('success', 'Settings updated. ')

  //   } catch (err) { mw.throwErr(err, req) }
  //   finally { res.redirect('/settings/user') }
  // })

// Delete account TODO: Test this
router.get('/user/delete', mw.ensureAuth, async (req, res) => {
  try {
    await User.findByIdAndRemove(req.user)
    req.flash('success', 'Your account has been deleted. ')
    res.redirect('/')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect('/settings')
  }
})

// Maps collection
router.route('/maps')
  .all(mw.ensureAuth)

  // List of maps
  .get( async (req, res) => {
    res.render('settings/maps', {
      active: 'settings',
      maps: await Map.find({
        _id: {$in:req.user.adminMaps},
      }),
    })
  })

  // TODO: Create new map
  .post((req, res) => {

  })

// Map item
router.route('/maps/:id')
  .all(mw.ensureAuth)

  // Get map settings page
  .get( async (req, res, next) => {
    let found_map = await Map
      .findById(sanitize(req.params.id))
      .populate('admins')
      .populate({
        path: 'vehicles',
        populate: {
          path: 'setByUser',
        },
      })
    if (!found_map) next() // 404
    else res.render('settings/map', {
      active: 'settings',
      map: found_map,
    })
  })

  // TODO: Set new map settings
  .post(async (req, res, next) => {

    // Validate slug
    const checkSlug = new Promise( async (resolve, reject) => {
      // Check existence
      if (req.body.slug === '') {
        req.flash('warning', `You must supply a slug.  `)
        resolve()

      // Check if unchanged
      } else if (req.user.maps[0].slug === slug(xss(req.body.slug))) resolve()

      // Check uniqueness
      else {
        try {
          let existingUser = await User.findOne({ slug: req.body.slug })

          // Not unique!
          if (existingUser && existingUser.id !== req.user.id) {
            req.flash( 'warning',
            `That slug, <u>${req.body.slug}</u>, is already in use by another map! `
            )

          // It's unique
          } else req.user.maps[0].slug = slug(xss(req.body.slug))

          resolve()
        } catch (err) { reject() }
      }
    })

    // Set settings when done
    try {
      await checkSlug
      debug('Setting map settings... ')

      // Set values
      req.user.maps[0].settings = {
        // TODO: Rescheme this
        units: req.body.units,
        defaultMap: {
          type: req.body.defaultMapType,
          zoom: req.body.defaultZoom,
          lat: req.body.defaultLat,
          lon: req.body.defaultLon,
        },
        showScale: !!(req.body.showScale),
        showSpeed: !!(req.body.showSpeed),
        showAlt: !!(req.body.showAlt),
        showStreetview: !!(req.body.showStreet),
        marker: req.body.marker
      }

      // Save user and send response
      debug(`Saving new settings for map ${req.user.maps[0].name}...`)
      await req.user.save()
      debug(`DONE!  Redirecting...`)
      req.flash('success', 'Settings updated. ')

    } catch (err) { mw.throwErr(err, req) }
    finally { res.redirect('/settings/maps') }
  })

// Delete map TODO: Test this
router.get('/maps/:id/delete', mw.ensureAuth, async (req, res, next) => {
  let found_map = await Map
    .findById(sanitize(req.params.id))
  if (!found_map) next() // 404
  else {
    try {
      await found_map.remove()
      req.flash('success', `Map deleted`)
      res.redirect('/settings/maps')
    } catch (err) {
      mw.throwErr(err, req)
      res.redirect(`/settings/maps/${req.params.id}`)
    }
  }
})

// TODO: Create new vehicle
router.put('map/:id/vehicles', mw.ensureAuth, (req, res) => {

})

// TODO: Delete vehicle
router.delete('map/:map-id/vehicles/:veh-id', mw.ensureAuth, (req, res) => {

})

// TODO: Create new admin
router.put('/map/:id/admins', mw.ensureAuth, (req, res) => {

})

// TODO: Delete admin
router.delete('map/:map-id/admins/:admin-id', mw.ensureAuth, (req, res) => {

})

// Redirects for URLs that moved to /account
router.all('/password', (req, res) => {
  res.redirect(307, '/account/password')
})
router.all('/password/:token', (req, res) => {
  res.redirect(307, `/account/password/${req.params.token}`)
})
router.all('/email/:token', (req, res) => {
  res.redirect(307, `/account/email/${req.params.token}`)
})

module.exports = router
