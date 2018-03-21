'use strict'

const router = require('express').Router()
const slug = require('slug')
const xss = require('xss')
const sanitize = require('mongo-sanitize')
const User = require('../models').user
const Map = require('../models').map
const debug = require('debug')('tracman-routes-index')

module.exports = router

  // Index
  .get('/', (req, res, next) => {
    res.render('index', {active: 'home'})
  })

  // Demo redirect
  .get('/demo', (req, res, next) => {
    res.redirect('/map/demo')
  })

  // Help
  .get('/help', (req, res) => {
    res.render('help', {active: 'help'})
  })

  // Terms of Service and Privacy Policy
  .get('/terms', (req, res) => {
    res.render('terms', {active: 'terms'})
  })
  .get('/privacy', (req, res) => {
    res.render('privacy', {active: 'privacy'})
  })

  // robots.txt
  .get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain')
    .send('User-agent: *\n' +
      'Disallow: /map/*\n' +
      'Allow: /map/demo'
    )
  })

  // favicon.ico
  // TODO: Just serve it
  .get('/favicon.ico', (req, res) => {
    res.redirect('/static/img/icon/by/16-32-48.ico')
  })

  // Endpoint to validate forms
  .get('/validate', async (req, res, next) => {

    // Validate user with email exists
    if (req.query.user) {
      try {
        if ( await User.findOne({
          email: sanitize(req.query.user)
        }) ) res.sendStatus(200)
        else res.sendStatus(400)
      } catch (err) {
        console.error(err)
        res.sendStatus(500)
      }

    // Validate unique slug
    } else if (req.query.slug) {
      try {
        let existing_map = await Map.findOne({
          slug: sanitize(slug(req.query.slug))
        })
        if (existing_map && existing_map.id!==req.user.id) res.sendStatus(400)
        else res.sendStatus(200)
      } catch (err) {
        console.error(err)
        res.sendStatus(500)
      }

    // Validate unique email
    } else if (req.query.email) {
      console.log(`Testing email ${req.query.email} for uniqueness`)
      try {
        let existing_user = User.findOne({ email: sanitize(req.query.email) })
        if (existing_user.id && existing_user.id !== req.user.id) {
          console.log(`Found user ${existing_user.id} with that email`)
          res.sendStatus(400)
        } else { res.sendStatus(200) }
      } catch (err) {
        console.error(err)
        res.sendStatus(500)
      }

    // Create slug and sanitize
    } else if (req.query.slugify) res.send(sanitize(slug(xss(slug(req.query.slugify)))))

    // Sanitize for mongo
    else if (req.query.mongo) res.send(sanitize(req.query.mongo))

    // Sanitize for XSS
    else if (req.query.xss) res.send(xss(req.query.xss))

    // 404
    else next()
  })

  // Link to androidapp in play store
  .get('/android', (req, res) => {
    res.redirect('https://play.google.com/store/apps/details?id=us.keithirwin.tracman')
  })

  // Link to iphone app in the apple store
  // ... maybe someday
  .get('/ios', (req, res) => {
    res.redirect('/help#why-is-there-no-ios-app')
  })
