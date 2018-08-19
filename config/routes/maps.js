'use strict'

const router = require('express').Router()
const mw = require('../middleware')
const crypto = require('crypto')
const xss = require('xss')
const sanitize = require('mongo-sanitize')
const Map = require('../models').map
const Vehicle = require('../models').vehicle
const debug = require('debug')('tracman-routes-maps')
// Trim slug to patch CVE-2017-16117
const slugify = function(s) {
  return require('slug')(s.slice(0,99))
}


router

  .route('/').all(mw.ensureAuth)

  // List of maps
  .get( async (req, res) => {

    // Find all vehicles tracked by this user
    debug(`Checking vehicles set by ${req.user.email}...`)
    const tracked_vehicles = await Vehicle.find({
      'setter': req.user.id,
    })
    debug(`User ${req.user.email} is setting ${tracked_vehicles.length} vehicles. `)

    res.render('maps', {
      active: 'maps',
      adminMaps: await Map.find({
        admins: req.user.email,
      }),
      trackMaps: await Map.find({
        'vehicles': {$in: 
          tracked_vehicles.map( v => v.id )
        }
      }),
    })
  })

  // Create new map
  .post(async (req, res) => {
    debug(`Creating new map...`)

    try {

      // Create map
      const new_map = new Map()
      new_map.created = Date.now()

      // Make current user only admin
      new_map.admins = [req.user.email]

      // Set new map name if provided
      new_map.name = (req.body.name.length>0) ?
        xss(req.body.name) : 'map'

      // Generate unique slug
      new_map.slug = await new Promise((resolve, reject) => {
        debug(`Creating new slug for map...`);

        (async function checkSlug (s, cb) {
          try {
            debug(`Checking to see if slug ${s} is taken...`)

            // Slug in use: generate a random one and retry
            if (await Map.findOne({slug:s})) {
              debug(`Slug ${s} is taken; generating another digit...`)
              crypto.randomBytes(1, (err, buf) => {
                if (err) {
                  debug('Failed to create random byte for slug!')
                  mw.throwErr(err, req)
                  reject()
                }
                if (buf)
                  checkSlug(sanitize(s+buf.toString('hex')), cb)
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

        // Start recursive function chain using map name as initial slug
        })(sanitize(slugify(new_map.name)), resolve)
      })

      // Save map
      await new_map.save()
      debug(`Successfully created new map ${new_map.id}`)
      req.flash('success', `Created new map <i>${new_map.name}</i>`)
      res.redirect(`/settings/maps/${new_map.id}`)

    } catch (err) {
      mw.throwErr(err)
      res.redirect(`/maps`)
    }

  })

module.exports = router
