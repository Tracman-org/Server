'use strict'

const router = require('express').Router()
const mw = require('../middleware')
const debug = require('debug')('tracman-routes-admin')
const User = require('../models').user

function ensureAdmin (req, res, next) {
	debug(`ensureAdmin called at ${req.url}`)
	if (req.user.isSiteAdmin) return next()
	else {
		const err = Error("Forbidden")
		err.status = 403
		next(err)
	}
	//TODO: test this by logging in as !isSiteAdmin and go to /admin
}

router.get('/', mw.ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const found = await User.find({}).sort({lastLogin: -1})
    res.render('admin', {
      active: 'admin',
      noFooter: '1',
      users: found,
      total: found.length
    })
  } catch (err) { mw.throwErr(err, req) }
})

router.get('/delete/:usrid', mw.ensureAuth, ensureAdmin, async (req, res, next) => {
  debug(`/delete/${req.params.usrid} called`)

  try {
    // Don't replace with findByIdAndRemove to ensure hooks fire
    await (await User.findById(req.params.usrid)).remove()
    req.flash('success', `<i>${req.params.usrid}</i> deleted.`)
    res.redirect('/admin')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect('/admin')
  }
})

module.exports = router
