'use strict'

const User = require('./models').user
const Map = require('./models').map
const Vehicle = require('./models').vehicle
const debug = require('debug')('tracman-rescheme')

module.exports = function (old_user) {
  return new Promise( async (resolve, reject) => {
    const old_user_object = old_user.toObject()

    // Confirm use of old schema
    if (!old_user_object.slug) {
      debug(`User ${old_user.id} does not have slug; not rescheming`)
      resolve(old_user)
    } else {
      debug(`Rescheming user ${old_user.id}...`)

      // Create new vehicle object
      let new_vehicle = new Vehicle({
        name: old_user_object.name,
        last: old_user_object.last,
        sk32: old_user_object.sk32,
        marker: old_user_object.marker || 'red',
      })
      debug(`Created new vehicle ${new_vehicle.id}`)

      // Create new map object
      let new_map = new Map({
        name: old_user_object.name,
        slug: old_user_object.slug,
        settings: {
          units: old_user_object.settings.units || 'standard',
          defaultMap: {
            type: old_user_object.settings.defaultMap || 'road',
            lat: old_user_object.last.lat || 0,
            lon: old_user_object.last.lon || 0,
            zoom: old_user_object.settings.defaultZoom || 11,
          },
          showScale: old_user_object.settings.showScale || false,
          showSpeed: old_user_object.settings.showSpeed || false,
          showTemp: old_user_object.settings.showTemp || false,
          showAlt: old_user_object.settings.showAlt || false,
          showStreetview: old_user_object.settings.showStreetview || false,
        },
        lastUpdate: old_user_object.last.time,
        vehicles: [new_vehicle],
      })
      debug(`Created new map ${new_map.id}`)

      // Create new user object
      let new_user = new User({
        name: old_user_object.name,
        email: old_user_object.email,
        newEmail: old_user_object.newEmail,
        emailToken: old_user_object.emailToken,
        auth: {
          password: old_user_object.auth.password,
          passToken: old_user_object.auth.passToken,
          passTokenExpires: old_user_object.auth.passTokenExpires,
          google: old_user_object.auth.google || old_user_object.googleID,
          facebook: old_user_object.auth.facebook,
          twitter: old_user_object.auth.twitter,
        },
        isSiteAdmin: old_user_object.isAdmin || false,
        isPro: old_user_object.isPro || false,
        created: old_user_object.created || 0,
        lastLogin: old_user_object.lastLogin || 0,
        isNewUser: old_user_object.isNewUser || true,
        maps: [new_map],
        setVehicles: [new_vehicle],
      })
      debug(`Created new user ${new_user.id}`)

      // Delete old object
      let old_user_id = old_user_object.id
      try {
        await old_user.remove()
        debug(`Deleted old user ${old_user_id}`)
      } catch (err) {
        debug(`Unable to delete old user ${old_user_id}!`)
        reject(err)
      }

      // Save new objects
      try {
        await Promise.all([
          new_user.save(),
          new_vehicle.save(),
          new_map.save(),
        ])
        debug(`Saved new user, map, and vehicle`)
        resolve(new_user)
      } catch (err) {
        debug(`Unable to save new user, map, or vehicle!`)
        reject(err)
      }

    }
  })
}
