'use strict'

const router = require('express').Router()
const slug = require('slug')
const xss = require('xss')
const User = require('../models.js').user

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
  .get('/validate', (req, res, next) => {
    // Validate unique slug
    if (req.query.slug) {
      User.findOne({ slug: slug(req.query.slug) })
      .then((existingUser) => {
        if (existingUser && existingUser.id!==req.user.id) res.sendStatus(400)
        else res.sendStatus(200)
      })
      .catch((err) => {
        console.error(err)
        res.sendStatus(500)
      })

    // Validate unique email
    } else if (req.query.email) {
      User.findOne({ email: req.query.email })
      .then((existingUser) => {
        if (existingUser && existingUser.id !== req.user.id) {
          res.sendStatus(400)
        } else { res.sendStatus(200) }
      })
      .catch((err) => {
        console.error(err)
        res.sendStatus(500)
      })

    // Create slug
    } else if (req.query.slugify) res.send(slug(xss(req.query.slugify)))

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
