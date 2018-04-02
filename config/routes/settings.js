'use strict'

const crypto = require('crypto')
const slug = require('slug')
const xss = require('xss')
const sanitize = require('mongo-sanitize')
const slugify = require('slug')
const mw = require('../middleware')
const mail = require('../mail')
const env = require('../env/env')
const debug = require('debug')('tracman-routes-settings')
const User = require('../models').user
const Map = require('../models').map
const Vehicle = require('../models').vehicle
const router = require('express').Router()

// Check admin auth and add map to res.locals
/* global getMap */
async function getMap(req, res, next) {
  try {
    // Pass map on to future routes
    res.locals.map = await Map.findById(sanitize(req.params.map))
    // No such map
    if (!res.locals.map) {
      req.flash('danger', `That map does not exist!`)
      res.redirect('/settings/maps')
    // User not authorized to edit this map
    } else if (!res.locals.map.admins.includes(req.user.email)) {
      const auth_err = Error(`Forbidden`)
      auth_err.status = 403
      throw auth_err
    // All clear, continue
    } else next()
  } catch(err) { next(err) }
}

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
  .post(async (req, res) => {
    debug('Setting user settings... ')
    try {

      // Set values
      req.user.name = xss(req.body.name)
      req.user.newEmail = await new Promise( async (resolve, reject) => {

        // Sanitize for mongo
        req.body.email = sanitize(req.body.email)

        // Check if changed
        if (req.user.email === req.body.email) resolve(req.body.email)

        else if (!mw.validateEmail(req.body.email)) {
          req.flash('warning', `<u>${req.body.email}</u> is not a valid email address.  `)
          reject()

        // Check uniqueness
        } else {

          try {
            const existing_user = await User.findOne({ 'email': req.body.email })

            // Not unique!
            if (existing_user && existing_user.id !== req.user.id) {
              debug(`User ${existing_user.id} already has that email!`)
              req.flash('warning', `That email, <u>${req.body.email}</u>, is already in use by another user! `)
              reject()

            // It's unique
            } else {

              // Create token
              debug(`Creating email token...`)
              const token = await req.user.createEmailToken()

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

              // Resolve, so it canbe set outside this promise
              resolve(req.body.email)

            }
          } catch (err) { reject(err) }
        }
      })

      // Save user and send response
      debug(`Saving new settings for user ${req.user.name}...`)
      await req.user.save()
      debug(`DONE!  Redirecting user...`)
      req.flash('success', 'Settings updated. ')

    } catch (err) { mw.throwErr(err, req) }
    finally { res.redirect('/settings/user') }

  })

// Delete account
router.get('/user/delete', mw.ensureAuth, async (req, res) => {
  try {
    req.user.remove()
    req.flash('success', 'Your account has been deleted. ')
    res.redirect('/')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect('/settings/user')
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
        admins: req.user.email,
      }),
    })
  })

  // Create new map
  .post(async (req, res) => {
    debug(`Creating new map...`)

    try {
      const new_map = new Map()
      new_map.name = xss(req.body.name)
      new_map.admins = [req.user.email]
      new_map.created = Date.now()

      // Generate unique slug
      new_map.slug = await new Promise((resolve, reject) => {
        debug(`Creating new slug for map...`);

        (async function checkSlug (s, cb) {
          try {
            debug(`Checking to see if slug ${s} is taken...`)

            // Slug in use: generate a random one and retry
            if (await Map.findOne({slug:s})) {
              debug(`Slug ${s} is taken; generating another...`)
              crypto.randomBytes(6, (err, buf) => {
                if (err) {
                  debug('Failed to create random bytes for slug!')
                  mw.throwErr(err, req)
                  reject()
                }
                if (buf) {
                  checkSlug(sanitize(buf.toString('hex')), cb)
                }
              })

            // Unique slug: proceed
            } else {
              debug(`Slug ${s} is unique`)
              cb(s)
            }
          } catch (err) {
            debug('Failed to create slug!')
            mw.throwErr(err, req)
            reject(err)
          }

        // Start recursive function chain using first part of email as initial slug
        })(sanitize(slugify(new_map.name)), resolve)
      })

      await new_map.save()

      debug(`Successfully created new map ${new_map.id}`)
      req.flash('success', `Created new map <i>${new_map.name}</i>`)
    } catch (err) { mw.throwErr(err) }
    finally { res.redirect(`/settings/maps`) }

  })

// Map settings
router.route('/maps/:map')
  .all(mw.ensureAuth, getMap)

  // Get map settings page
  .get(async (req, res, next) => {

    // Find and populate associated map
    const found_map = await Map
      .findById(sanitize(req.params.map))
      .populate({
        path: 'vehicles',
        populate: {
          path: 'setter',
        },
      })

    // Return map settings page
    if (!found_map) next() // 404
    else res.render('settings/map', {
      active: 'settings',
      map: found_map,
    })

  })

  // Set map settings
  .post(async (req, res, next) => {
    switch (req.body.type) {

      // Set basic settings
      case 'basics':
        try {

          // Set settings
          debug(`Setting map name and slug... `)
          res.locals.map.name = xss(req.body.name)
          res.locals.map.slug = await new Promise( async (resolve, reject) => {
            debug(`Checking slug ${req.body.slug}... `)
            try {

              // Check existence
              if (req.body.slug === '') {
                req.flash('warning', 'You must supply a slug. ')
                reject()

              // Check uniqueness
              } else {
                const valid_slug = slug(xss(req.body.slug))
                const existing_map = await Map.findOne({ slug: valid_slug })

                // Not unique!
                if (existing_map && existing_map.id !== req.params.map) {
                  req.flash('warning', 'That slug is already in use by another map! ')
                  reject()

                // It's unique
                } else resolve(valid_slug)
              }

            } catch (err) { reject(err) }

          })

          // Save map and send response
          debug(`Saving new settings for map ${res.locals.map.name}...`)
          await res.locals.map.save()

          // Success
          debug(`Done saving basic settings for map ${res.locals.map.id}.  Redirecting...`)
          req.flash('success', 'Basic map settings updated. ')

        } catch (err) { mw.throwErr(err, req) }

        finally { res.redirect(`/settings/maps/${req.params.map}#basics`) }
        break

      // Set display settings
      case 'display':
        try {

          // Set settings
          debug(`Setting map ${req.params.map} display settings... `)
          res.locals.map.settings.visibility = req.body.visibility
          res.locals.map.settings.units = req.body.units
          res.locals.map.settings.defaultMapType = req.body.mapType
          res.locals.map.settings.defaultZoom = req.body.defaultZoom
          res.locals.map.settings.center.type = req.body.center
          res.locals.map.settings.center.follow = req.body.follow
          res.locals.map.settings.center.lat = req.body.staticLat
          res.locals.map.settings.center.lon = req.body.staticLon
          res.locals.map.settings.canZoom = (req.body.canZoom=='on')
          res.locals.map.settings.canPan = (req.body.canPan==='on')
          res.locals.map.settings.display.scale = (req.body.showScale==='on')
          res.locals.map.settings.display.speed = (req.body.showSpeed==='on')
          res.locals.map.settings.display.alt = (req.body.showAlt==='on')
          res.locals.map.settings.display.streetview = (req.body.showStreetview==='on')

          // Save map and send response
          debug(`Saving new settings for map ${res.locals.map.name}...`)
          await res.locals.map.save()

          // Success
          debug(`Done updating display settings for map ${res.locals.map.id}.  Redirecting...`)
          req.flash('success', 'Map display settings updated. ')

        } catch (err) { mw.throwErr(err, req) }

        finally { res.redirect(`/settings/maps/${req.params.map}#display`) }
        break

      // Set vehicle setttings
      case 'vehicles':
        try {

          // Organize request body
          debug(`Organizing request body data... `)
          const update_request = {}
          for (const prop in req.body) {
            if (prop!=='_csrf'&&prop!=='type') { // Ignore CSRF token and form type
              // New vehicle
              if (!update_request[prop.slice(-24)])
                update_request[sanitize(prop.slice(-24))] = {}
              // New vehicle property
              update_request[prop.slice(-24)][prop.slice(0,-25)] = req.body[prop]
            }
          }
          debug(`Organized request body data: ${update_request}`)

          // Update each vehicle
          ;( await Vehicle.find({ '_id': {
            $in: Object.keys(update_request)
          } }) ).forEach( async (vehicle) => {
            debug(`Updating vehicle ${vehicle.id}...`)
            vehicle.name = update_request[vehicle.id].vehicleName
            vehicle.setterEmail = update_request[vehicle.id].vehicleSetter
            vehicle.marker = update_request[vehicle.id].vehicleMarker
            vehicle.setter = await User.findOne({
              'email': sanitize(update_request[vehicle.id].vehicleSetter)
            })
            vehicle.save()
            debug(`Vehicle ${vehicle.id} updated.`)
          })

          // Success
          debug(`Done updating vehicles for map ${res.locals.map.id}.  Redirecting...`)
          req.flash('success', 'Map vehicle settings updated. ')

        } catch (err) { mw.throwErr(err, req) }

        finally { res.redirect(`/settings/maps/${req.params.map}#vehicles`) }
        break

      default:
        next() // 404
        break

    }
})

// Delete map
router.get('/maps/:map/delete', mw.ensureAuth, getMap, async (req, res, next) => {
  debug(`Deleting map ${req.params.map}...`)
  try {
    await res.locals.map.remove()
    req.flash('success', `Map deleted`)
    res.redirect('/settings/maps')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect(`/settings/maps/${req.params.map}`)
  }
})

// Create new vehicle
router.post('/maps/:map/vehicles/new', mw.ensureAuth, getMap, async (req, res) => {
  debug(`Creating new vehicle for map ${req.params.map}...`)
  try {

    // Check that email is valid
    if (!mw.validateEmail(req.body.setter)) {
      res.status = 400
      res.json({
        'danger': `That email, <u>${req.body.setter}</u> is invalid!`,
      })
    } else {

      // Create vehicle
      const new_vehicle = new Vehicle()
      new_vehicle.setterEmail = sanitize(req.body.setter)
      new_vehicle.created = Date.now()
      new_vehicle.name = xss(req.body.name)
      // Only set marker if it's whitelisted
      new_vehicle.marker =
        (mw.markers.includes(req.body.marker))?
        req.body.marker : 'red'
      new_vehicle.setter = await User.findOne({
        'email': sanitize(req.body.setter)
      })

      // Don't send response until ready
      await Promise.all([

        // Save new vehicle
        new_vehicle.save(),

        // Add vehicle to map
        res.locals.map.update({
          $push: {
            vehicles: new_vehicle,
          }
        }),

      ])

      // Respond
      res.status(201).json({
        id: new_vehicle.id,
        name: new_vehicle.name,
        setter: new_vehicle.setterEmail,
        marker: new_vehicle.marker,
      })

    }

  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

// Delete vehicle
router.delete('/maps/:map/vehicles/:veh', mw.ensureAuth, getMap, async (req, res) => {
  debug(`Deleting vehicle ${req.params.veh}...`)
  try {
    await Promise.all([

      // Delete vehicle
      Vehicle.findByIdAndRemove(sanitize(req.params.veh)),

      // Remove vehicle from map
      res.locals.map.update({
        $pull: {
          'vehicles': sanitize(req.params.veh),
        }
      }),

    ])
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

// Create new admin
router.post('/maps/:map/admins', mw.ensureAuth, getMap, async (req, res) => {
  debug(`Creating new admin for map ${req.params.map}`)
  try {

    // Validate email
    if (!mw.validateEmail(req.body.email)) {
      res.status = 400
      res.json({
        'danger': `That email, <u>${req.body.email}</u> is invalid!`,
      })
    } else {

      // Add admin email to map
      await res.locals.map.update({
        $addToSet: {
          'admins': req.body.email,
        }
      })

      // Respond
      res.status(201).json({
        email: req.body.email,
      })

    }

  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }

})

// Delete admin
router.delete('/maps/:map/admins/:admin', mw.ensureAuth, getMap, async (req, res) => {
  debug(`Deleting admin ${req.params.admin}...`)
  try {

    // Remove admin email from map
    await res.locals.map.update({
      $pull: {
        'admins': sanitize(req.params.admin),
      }
    })

    // Respond
    res.sendStatus(200)

  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
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
