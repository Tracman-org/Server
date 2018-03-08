'use strict'

const router = require('express').Router()
const mw = require('../middleware')
const env = require('../env/env')
const sanitize = require('mongo-sanitize')
const User = require('../models').user

// Redirect to real slug
router.get('/', mw.ensureAuth, (req, res) => {
  res.redirect(`/map/${req.user.maps[0].slug}`)
})

// Demo
router.get('/demo', (req, res, next) => {
  res.render('map', {
    active: 'demo',
    map: {
      _id: 'demo',
      name: 'Demo',
      last: {
        lat: 40.1165853,
        lon: -87.5417312,
        dir: 249.0,
        spd: 19.015747
      },
      settings: {
        marker: 'red',
        showAlt: false,
        showTemp: false,
        showSpeed: false,
        showScale: false,
        showStreetview: true,
        defaultMap: {
          type: 'road',
          lat: 40.1165853,
          lon: -87.5417312,
          zoom: 13,
        },
        units: 'standard'
      }
    },
    mapApi: env.googleMapsAPI,
    user: req.user,
    noFooter: '1',
    noHeader: (req.query.noheader) ? req.query.noheader.match(/\d/)[0] : 0,
    disp: (req.query.disp) ? req.query.disp.match(/\d/)[0] : 2, // 0=map, 1=streetview, 2=both
    newmapurl: (req.query.new) ? env.url + '/map/' + req.params.slug : ''
  })
})

// Show map
router.get('/:slug?', async (req, res, next) => {
  try {
    if (req.params.slug != sanitize(req.params.slug)) {
      throw new Error(`Possible injection attempt with slug: ${req.params.slug}`)
    } else {
      let map = await Map.findOne({slug: req.params.slug})
    if (!map) next() // 404
    else {
      res.render('map', {
        active: (req.user && req.user.maps[0].id === map.id)? 'map':'', // For header nav
        mapData: map,
        mapApi: env.googleMapsAPI,
        user: req.user, // TODO: MULTIPLE: Check if this is needed
        // Check if user can set a vehicle in this map
        setVehicleId: (map.vehicles.indexOf(req.user.setVehicles[0])>=0)? req.user.setVehicles[0].id : '',
        noFooter: '1',
        noHeader: (req.query.noheader) ? req.query.noheader.match(/\d/)[0] : 0,
        disp: (req.query.disp) ? req.query.disp.match(/\d/)[0] : 2, // 0=map, 1=streetview, 2=both
        newmapurl: (req.query.new) ? env.url + '/map/' + req.params.slug : ''
      })
    }
  } catch (err) { mw.throwErr(err, req) }
})

module.exports = router
