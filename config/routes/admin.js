'use strict'

const router = require('express').Router()
const mw = require('../middleware.js')
const debug = require('debug')('tracman-routes-admin')
const User = require('../models.js').user

router.get('/', mw.ensureAdmin, async (req, res) => {
  try {
    let found = await User.find({}).sort({lastLogin: -1})
    res.render('admin', {
      active: 'admin',
      noFooter: '1',
      users: found,
      total: found.length
    })
  } catch (err) { mw.throwErr(err, req) }
})

router.get('/delete/:usrid', mw.ensureAdmin, async (req, res, next) => {
  debug(`/delete/${req.params.usrid} called`)

  try {
    await User.findOneAndRemove({'_id': req.params.usrid})
    req.flash('success', `<i>${req.params.usrid}</i> deleted.`)
    res.redirect('/admin')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect('/admin')
  }
})

module.exports = router
