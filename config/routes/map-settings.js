'use strict'

const slug = require('slug')
const xss = require('xss')
const mw = require('../middleware')
const User = require('../models').user
const debug = require('debug')('tracman-routes-map-settings')
const router = require('express').Router()

// Settings form
router.route('/')
  .all(mw.ensureAuth, (req, res, next) => {
    next()
  })

  // Get settings form
  .get((req, res) => {
    res.render('map-settings', {active: 'map-settings'})
  })

  // Set new settings
  .post( async (req, res, next) => {

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
    finally { res.redirect('/map-settings') }
  })


// Delete account
router.get('/delete', async (req, res) => {
  try {
    await User.findByIdAndRemove(req.user)
    req.flash('success', 'Your account has been deleted. ')
    res.redirect('/')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect('/map-settings')
  }
})

module.exports = router
