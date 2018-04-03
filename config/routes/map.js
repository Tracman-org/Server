'use strict'

const router = require('express').Router()
const mw = require('../middleware')
const env = require('../env/env')
const sanitize = require('mongo-sanitize')
const Map = require('../models').map
const Vehicle = require('../models').vehicle
const debug = require('debug')('tracman-routes-map')

// Redirect to real slug
router.get('/', mw.ensureAuth, async (req, res) => {
  debug(`Finding a map to redirect to...`)
  const vehicle = await Vehicle.findOne({'setter':req.user.id})
  if (!vehicle) {
    debug(`User sets for no vehicles.  Redirecting to settings/maps...`)
    res.redirect('/settings/maps')
  } else {
    debug(`Found vehicle ${vehicle.id}; searching for associated map...`)
    const map = await Map.findOne({'vehicles':{$in:[vehicle.id]}})
    if (!map) {
      console.error(`Couldn't find map for vehicle ${vehicle.id}!`)
      res.redirect('/')
    } else {
      debug(`Found map ${map.id}; redirecting to /map/${map.slug}...`)
      res.redirect(`/map/${map.slug}`)
    }
  }
})

// Demo
router.get('/demo', (req, res, next) => {
  debug(`Demo requested`)
  res.render('map', {
    active: 'demo',
    mapData: {
      _id: 'demo',
      name: 'Demo',
      settings: {
        units: 'standard',
        defaultMap: {
          type: 'road',
          lat: 40.1165853,
          lon: -87.5417312,
          zoom: 13,
        },
        showScale: true,
        showSpeed: true,
        showAlt: false,
        showStreetview: true,
      },
      lastUpdate: new Date(),
      vehicles: [{
        id: 'demo-veh',
        name: 'Demo',
        last: {
          time: new Date(),
          lat: 40.1165853,
          lon: -87.5417312,
          dir: 249.0,
          spd: 19.015747,
        },
        marker: 'red',
      }],
    },
    mapKey: env.googleMapsAPI,
    user: req.user,
    setVehicleId: '',
    noFooter: '1',
    noHeader: (req.query.noheader) ? req.query.noheader.match(/\d/)[0] : 0,
    disp: (req.query.disp) ? req.query.disp.match(/\d/)[0] : 2, // 0=map, 1=streetview, 2=both
    newmapurl: (req.query.new) ? env.url + '/map/' + req.params.slug : ''
  })
})

// Show map
router.get('/:slug', async (req, res, next) => {
  debug(`Map with slug ${req.params.slug} requested`)
  try {
    if (req.params.slug != sanitize(req.params.slug)) {
      console.error(`Possible injection attempt with slug: ${req.params.slug}`)
      next() // 404
    } else {
      const map = await Map
        .findOne({slug: sanitize(req.params.slug)})
        .populate('vehicles')
      if (!map) next() // 404
      else if ( map.settings.visibility!=='private' || map.admins.includes(req.user.email) )
        res.render('map', {
          // Header 'map' active if this user can set this map
          active: ((map.vehicles.map(a => a.setter.toString())).includes(req.user.id))?'map':'',
          mapData: map,
          mapKey: env.googleMapsAPI,
          user: req.user,
          noHeader: (req.query.noheader) ? req.query.noheader.match(/\d/)[0] : 0,
          disp: (req.query.disp) ? req.query.disp.match(/\d/)[0] : 2, // 0=map, 1=streetview, 2=both
          newmapurl: (req.query.new) ? env.url + '/map/' + req.params.slug : ''
        })
      else {
        res.status(403)
        next()
      }
    }
  } catch (err) { mw.throwErr(err, req) }
})

module.exports = router
