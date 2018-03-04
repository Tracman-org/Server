'use strict'

const router = require('express').Router()
const mw = require('../middleware.js')
const env = require('../env/env.js')
const sanitize = require('mongo-sanitize')
const User = require('../models.js').user

// Redirect to real slug
router.get('/', mw.ensureAuth, (req, res) => {
  res.redirect(`/map/${req.user.slug}`)
})

// Demo
router.get('/demo', (req, res, next) => {
  res.render('map', {
    active: 'demo',
    mapuser: {
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
        defaultZoom: 13,
        defaultMap: 'road',
        units: 'standard'
      }
    },
    mapApi: env.googleMapsAPI,
    user: req.user,
    noFooter: '1',
    noHeader: (req.query.noheader) ? req.query.noheader.match(/\d/)[0] : 0,
    disp: (req.query.disp) ? req.query.disp.match(/\d/)[0] : 2, // 0=map, 1=streetview, 2=both
    newuserurl: (req.query.new) ? env.url + '/map/' + req.params.slug : ''
  })
})

// Show map
router.get('/:slug?', async (req, res, next) => {
  try {
    if (req.params.slug != sanitize(req.params.slug)) {
      throw new Error(`Possible injection attempt with slug: ${req.params.slug}`)
    } else {
      let map_user = await User.findOne({slug: req.params.slug})
      if (!map_user) next() // 404
      else {
        var active = '' // For header nav
        if (req.user && req.user.id === map_user.id) active = 'map'
        res.render('map', {
          active: active,
          mapuser: map_user,
          mapApi: env.googleMapsAPI,
          user: req.user,
          noFooter: '1',
          noHeader: (req.query.noheader) ? req.query.noheader.match(/\d/)[0] : 0,
          disp: (req.query.disp) ? req.query.disp.match(/\d/)[0] : 2, // 0=map, 1=streetview, 2=both
          newuserurl: (req.query.new) ? env.url + '/map/' + req.params.slug : ''
        })
      }
    }
  } catch (err) { mw.throwErr(err, req) }
})

module.exports = router
