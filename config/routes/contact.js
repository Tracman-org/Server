'use strict'

const env = require('../env/env')
const request = require('request')
const mw = require('../middleware')
const mail = require('../mail')
const router = require('express').Router()

module.exports = router

// Display contact form
.get('/', (req, res) => {
  res.render('contact', {active: 'contact',
    sitekey: env.recaptchaSitekey
  })
})

.post('/', (req, res, next) => {
  // Check email
  if (req.body.email === '') {
    req.flash('warning', `You need to enter an email address.  `)
    res.redirect('/contact')
  } else if (!mw.validateEmail(req.body.email)) {
    req.flash('warning', `<u>${req.body.email}</u> is not a valid email address.  `)
    res.redirect('/contact')

  // Check for message
  } else if (req.body.message === '') {
    req.flash('warning', `You need to enter a message.  `)
    res.redirect('/contact')

  // Passed validations
  } else {
    // Confirm captcha
    request.post('https://www.google.com/recaptcha/api/siteverify', {form: {
      secret: env.recaptchaSecret,
      response: req.body['g-recaptcha-response'],
      remoteip: req.ip
    }}, async (err, response, body) => {
      // Check for errors
      if (err) {
        mw.throwErr(err, req)
        res.redirect('/contact')
      }
      if (response.statusCode !== 200) {
        let err = new Error('Bad response from reCaptcha service')
        mw.throwErr(err, req)
        res.redirect('/contact')

      // No errors
      } else {
        // Captcha failed
        if (!JSON.parse(body).success) {
          let err = new Error('Failed reCaptcha')
          mw.throwErr(err, req)
          res.redirect('/contact')

        // Captcha succeeded
        } else {
          try {
            await mail.send({
              from: `${req.body.name} <${req.body.email}>`,
              to: `Tracman Contact <contact@tracman.org>`,
              subject: req.body.subject || 'A message',
              text: req.body.message
            })
            req.flash('success', `Your message has been sent. `)
            res.redirect('/')
          } catch (err) {
            mw.throwErr(err, req)
            res.redirect('/contact')
          }
        }
      }
    })
  }
})
