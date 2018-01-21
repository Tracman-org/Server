'use strict'

const router = require('express').Router(),
  zxcvbn = require('zxcvbn'),
  mw = require('../middleware.js'),
  mail = require('../mail.js')

router

  .get('/mail', async (req, res, next) => {
    try {
      await mail.send({
        to: `"Keith Irwin" <hypergeek14@gmail.com>`,
        from: mail.noReply,
        subject: 'Test email',
        text: mail.text("Looks like everything's working! "),
        html: mail.html("<p>Looks like everything's working! </p>")
      })
      console.log('Test email should have sent...')
      res.sendStatus(200)
    } catch (err) {
      mw.throwErr(err, req)
      res.sendStatus(500)
    }
  })

  .get('/password', (req, res) => {
    res.render('password')
  })
  .post('/password', (req, res, next) => {
    let zxcvbnResult = zxcvbn(req.body.password)
    if ( // Less than ten days
      zxcvbnResult.crack_times_seconds.online_no_throttling_10_per_second < 864000
    ) {
      let err = new Error(
        `That password could be cracked in \
        ${zxcvbnResult.crack_times_display.online_no_throttling_10_per_second}!  \
        Come up with a more complex password that would take at least 10 days to crack. `
      )
      mw.throwErr(err, req)
      next(err)
    } else {
      res.sendStatus(200)
    }
  })

  .get('/settings', (req, res) => {
    res.render('settings')
  })
  .post('/settings', (req, res) => {

    // TODO: Test validation here?

  })

module.exports = router
