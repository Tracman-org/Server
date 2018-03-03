'use strict'

const User = require('./models').user
const Map = require('./models').map
const Vehicle = require('./models').vehicle
const debug = require('debug')('tracman-rescheme')

module.exports = function (old_user) {
  return new Promise( async (resolve, reject) => {
    
    // Confirm use of old schema
    if (!old_user.slug) {
      debug(`User ${old_user.id} does not have slug; not rescheming`)
      resolve(old_user)
    } else {
      debug(`Rescheming user ${old_user.id}...`)
  
      // Create new vehicle object
      let new_vehicle = new Vehicle({
        name: old_user.name,
        last: old_user.last,
        sk32: old_user.sk32,
        marker: old_user.marker || 'red',
      })
      debug(`Created new vehicle ${new_vehicle.id}`)
  
      // Create new map object
      let new_map = new Map({
        name: old_user.name,
        slug: old_user.slug,
        settings: {
          units: old_user.settings.units || 'standard',
          defaultMap: {
            type: old_user.settings.defaultMap || 'road',
            lat: old_user.last.lat || 0,
            lon: old_user.last.lon || 0,
            zoom: old_user.settings.defaultZoom || 11,
          },
          showScale: old_user.settings.showScale || false,
          showSpeed: old_user.settings.showSpeed || false,
          showTemp: old_user.settings.showTemp || false,
          showAlt: old_user.settings.showAlt || false,
          showStreetview: old_user.settings.showStreetview || false,
        },
        lastUpdate: old_user.last.time,
        vehicles: [new_vehicle],
      })
      debug(`Created new map ${new_map.id}`)
  
      // Create new user object
      let new_user = new User({
        name: old_user.name,
        email: old_user.email,
        newEmail: old_user.newEmail,
        emailToken: old_user.emailToken,
        auth: {
          password: old_user.auth.password,
          passToken: old_user.auth.passToken,
          passTokenExpires: old_user.auth.passTokenExpires,
          google: old_user.auth.google || old_user.googleID,
          facebook: old_user.auth.facebook,
          twitter: old_user.auth.twitter,
        },
        isSiteAdmin: old_user.isAdmin || false,
        isPro: old_user.isPro || false,
        created: old_user.created || 0,
        lastLogin: old_user.lastLogin || 0,
        isNewUser: old_user.isNewUser || true,
        maps: [new_map],
        setVehicles: [new_vehicle],
      })
      debug(`Created new user ${new_user.id}`)
  
      // Delete old object
      let old_user_id = old_user.id
      try {
        await old_user.remove()
        debug(`Deleted old user ${old_user_id}`)
      } catch (err) {
        debug(`Unable to delete old user ${old_user_id}!`)
        reject(err)
      }
  
      // Save new objects
      try {
        await new Promise.all([
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
