'use strict'

const router = require('express').Router()
const mw = require('../middleware')
const env = require('../env/env')
const sanitize = require('mongo-sanitize')
const Map = require('../models').map
const debug = require('debug')('tracman-routes-map')

// Redirect to real slug
router.get('/', mw.ensureAuth, async (req, res) => {
  //TODO: Get rid of this route and add a page with map selection
  debug(`Redirecting user to the map they can set`)
  let map = await Map.findOne({'vehicles':{$in:[req.user.setVehicle]}})
  res.redirect(`/map/${map.slug}`||'/')
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
      let map = await Map.findOne({slug: sanitize(req.params.slug)})
        .populate('vehicles').exec()
      if (!map) next() // 404
      else {
        res.render('map', {
          active: (req.user && req.user.adminMaps[0] === map.id)? 'map':'', // For header nav
          mapData: map,
          mapKey: env.googleMapsAPI,
          user: req.user,
          setVehicleId: (req.isAuthenticated())? req.user.setVehicle :'',
          noFooter: '1',
          noHeader: (req.query.noheader) ? req.query.noheader.match(/\d/)[0] : 0,
          disp: (req.query.disp) ? req.query.disp.match(/\d/)[0] : 2, // 0=map, 1=streetview, 2=both
          newmapurl: (req.query.new) ? env.url + '/map/' + req.params.slug : ''
        })
      }
    }
  } catch (err) { mw.throwErr(err, req) }
})

module.exports = router
