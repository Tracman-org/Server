'use strict'

const slug = require('slug')
const xss = require('xss')
const sanitize = require('mongo-sanitize')
const mw = require('../middleware')
const mail = require('../mail')
const env = require('../env/env')
const debug = require('debug')('tracman-routes-settings')
const User = require('../models').user
const Map = require('../models').map
const router = require('express').Router()

// Settings index
router.get('/', mw.ensureAuth, async (req, res) => {
  res.render('settings/index', {
    active: 'settings',
  })
})

// User settings
router.route('/user')
  .all(mw.ensureAuth)

  // Show user settings page
  .get( (req, res) => {
    res.render('settings/user', {
      active: 'settings',
    })
  })

  // TODO: Set user settings
  // .post( (req, res) => {

  //   // Validate email
  //   const checkEmail = new Promise( async (resolve, reject) => {

  //     // Check validity
  //     if (!mw.validateEmail(req.body.email)) {
  //       req.flash('warning', `<u>${req.body.email}</u> is not a valid email address.  `)
  //       resolve()

  //     // Check if unchanged
  //     } else if (req.user.email === req.body.email) resolve()

  //     // Check uniqueness
  //     else {
  //       try {
  //         let existingUser = await User.findOne({ email: req.body.email })

  //         // Not unique!
  //         if (existingUser && existingUser.id !== req.user.id) {
  //           debug('Email not unique!')
  //           req.flash('warning',
  //             `That email, <u>${req.body.email}</u>, is already in use by another user! `
  //           )
  //           resolve()

  //         // It's unique
  //         } else {
  //           debug('Email is unique')
  //           req.user.newEmail = req.body.email

  //           // Create token
  //           debug(`Creating email token...`)
  //           let token = await req.user.createEmailToken()

  //           // Send token to user by email
  //           debug(`Mailing new email token to ${req.body.email}...`)
  //           await mail.send({
  //             to: `"${req.user.name}" <${req.body.email}>`,
  //             from: mail.noReply,
  //             subject: 'Confirm your new email address for Tracman',
  //             text: mail.text(
  //               `A request has been made to change your Tracman email address.  \
  //               If you did not initiate this request, please disregard it.  \n\n\
  //               To confirm your email, follow this link:\n${env.url}/account/email/${token}. `
  //             ),
  //             html: mail.html(
  //               `<p>A request has been made to change your Tracman email address.  \
  //               If you did not initiate this request, please disregard it.  </p>\
  //               <p>To confirm your email, follow this link:\
  //               <br><a href="${env.url}/account/email/${token}">\
  //               ${env.url}/account/email/${token}</a>. </p>`
  //             )
  //           })

  //           req.flash('warning',
  //             `An email has been sent to <u>${req.body.email}</u>.  Check your inbox to confirm your new email address. `
  //           )
  //           resolve()
  //         }
  //       } catch (err) { reject() }
  //     }
  //   })

  //   // Set settings when done
  //   try {
  //     await checkEmail
  //     debug('Setting user settings... ')

  //     // Set values
  //     req.user.name = xss(req.body.name)

  //     // Save user and send response
  //     debug(`Saving new settings for user ${req.user.name}...`)
  //     await req.user.save()
  //     debug(`DONE!  Redirecting user...`)
  //     req.flash('success', 'Settings updated. ')

  //   } catch (err) { mw.throwErr(err, req) }
  //   finally { res.redirect('/settings/user') }
  // })

// Delete account TODO: Test this
router.get('/user/delete', mw.ensureAuth, async (req, res) => {
  try {
    await User.findByIdAndRemove(req.user)
    req.flash('success', 'Your account has been deleted. ')
    res.redirect('/')
  } catch (err) {
    mw.throwErr(err, req)
    res.redirect('/settings')
  }
})

// Maps collection
router.route('/maps')
  .all(mw.ensureAuth)

  // List of maps
  .get( async (req, res) => {
    res.render('settings/maps', {
      active: 'settings',
      maps: await Map.find({
        _id: {$in:req.user.adminMaps},
      }),
    })
  })

  // TODO: Create new map
  .post((req, res) => {

  })

// Get map settings
router.get('/maps/:map', mw.ensureAuth, async (req, res, next) => {

    // Find and populate associated map
    const found_map = await Map
      .findById(sanitize(req.params.map))
      .populate({
        path: 'vehicles',
        populate: {
          path: 'setter',
        },
      })

    // Return map settings page
    if (!found_map) next() // 404
    else res.render('settings/map', {
      active: 'settings',
      map: found_map,
    })

  })
// Redirect faulty POSTs
router.get('/maps/:map/basics', (req, res) => {
  res.redirect(`/settings/maps/${req.params.map}#basics`)
})
router.get('/maps/:map/display', (req, res) => {
  res.redirect(`/settings/maps/${req.params.map}#display`)
})
router.get('/maps/:map/vehicles', (req, res) => {
  res.redirect(`/settings/maps/${req.params.map}#vehicles`)
})
router.get('/maps/:map/admins', (req, res) => {
  res.redirect(`/settings/maps/${req.params.map}#admins`)
})

// Set basic map settings
router.post('/maps/:map/basics', async (req, res, next) => {
  try {

    // Get map
    const map = await Map.findById(sanitize(req.params.map))
    if (!map) throw new Error(`Could not find map with ID ${req.params.map}!`)

    // Validate slug
    const checked_slug = new Promise( async (resolve, reject) => {
      debug(`Checking slug ${req.body.slug}... `)
      try {

        // Check existence
        if (req.body.slug === '')
          throw new Error('You must supply a slug.  ')
  
        // Check uniqueness
        else {
          const valid_slug = slug(xss(req.body.slug))
          const existing_map = await Map.findOne({ slug: valid_slug })
  
          // Not unique!
          if (existing_map && existing_map.id !== req.params.map)
            throw new Error('That slug is already in use by another map! ')
  
          // It's unique
          else resolve(valid_slug)
        }
        
      } catch (err) { reject(err) }
      
    })

    // Set settings
    debug(`Setting map name to ${xss(req.body.name)} and slug to ${await checked_slug}... `)
    map.slug = await checked_slug
    map.name = xss(req.body.name)

    // Save user and send response
    debug(`Saving new settings for map ${map.name}...`)
    await map.save()

    // Success
    debug(`DONE!  Redirecting...`)
    req.flash('success', 'Settings updated. ')

  } catch (err) { mw.throwErr(err, req) }
  finally { res.redirect(`/settings/maps/${req.params.map}#basics`) }

})

// Set display settings
router.post('/maps/:map/display',async (req, res, next) => {

})

// Set vehicle settings
router.post('/maps/:map/vehicles', async (req, res, next) => {

})

// Delete map TODO: Test this
router.get('/maps/:map/delete', mw.ensureAuth, async (req, res, next) => {
  debug(`Deleting map ${req.params.map}...`)
  let found_map = await Map
    .findById(sanitize(req.params.map))
  if (!found_map) next() // 404
  else {
    try {
      await found_map.remove()
      req.flash('success', `Map deleted`)
      res.redirect('/settings/maps')
    } catch (err) {
      mw.throwErr(err, req)
      res.redirect(`/settings/maps/${req.params.map}`)
    }
  }
})

// TODO: Create new vehicle
router.post('/maps/:map/vehicles/new', mw.ensureAuth, (req, res) => {
  debug(`Creating new vehicle for map ${req.params.map}...`)
  res.statusCode = 201
  res.json({
    id: 'fakeid',
    name: req.body.name,
    setter: req.body.setter,
    marker: req.body.marker,
  })
})

// TODO: Delete vehicle
router.delete('/maps/:map/vehicles/:veh', mw.ensureAuth, (req, res) => {
  debug(`Deleting vehicle ${req.params.veh}...`)
  res.sendStatus(200)
})

// TODO: Create new admin
router.post('/maps/:map/admins', mw.ensureAuth, (req, res) => {
  debug(`Creating new admin for map ${req.params.map}`)
  res.statusCode = 201
  res.json({
    email: req.body.email,
  })
})

// TODO: Delete admin
router.delete('/maps/:map/admins/:admin', mw.ensureAuth, (req, res) => {
  debug(`Deleting admin ${req.params.admin}...`)
  // Don't forget that req.params.admin is an email, not an id
  res.sendStatus(200)
})

// Redirects for URLs that moved to /account
router.all('/password', (req, res) => {
  res.redirect(307, '/account/password')
})
router.all('/password/:token', (req, res) => {
  res.redirect(307, `/account/password/${req.params.token}`)
})
router.all('/email/:token', (req, res) => {
  res.redirect(307, `/account/email/${req.params.token}`)
})

module.exports = router
