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

      // Create new objects
      let new_vehicle = new Vehicle()
      let new_user = new User()
      let new_map = new Map()
      debug(`Created new mongoose objects`)

      // Create new vehicle object
      new_vehicle.name = old_user_object.name
      new_vehicle.last = old_user_object.last
      new_vehicle.marker = old_user_object.marker || 'red'
      new_vehicle.map = new_map
      new_vehicle.setByUser = new_user
      debug(`Set properties for new vehicle ${new_vehicle.id}`)

      // Create new map object
      new_map.name = old_user_object.name
      new_map.slug = old_user_object.slug
      new_map.settings = {
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
      }
      new_map.lastUpdate = old_user_object.last.time
      new_map.vehicles = [new_vehicle]
      new_map.admins = [new_user]
      debug(`Set properties for new map ${new_map.id}`)

      // Create new user object
      new_user.name = old_user_object.name
      new_user.email = old_user_object.email,
      new_user.newEmail = old_user_object.newEmail,
      new_user.emailToken = old_user_object.emailToken,
      new_user.auth = {
        password: old_user_object.auth.password,
        passToken: old_user_object.auth.passToken,
        passTokenExpires: old_user_object.auth.passTokenExpires,
        google: old_user_object.auth.google || old_user_object.googleID,
        facebook: old_user_object.auth.facebook,
        twitter: old_user_object.auth.twitter,
      }
      new_user.isSiteAdmin = old_user_object.isAdmin || false
      new_user.isPro = old_user_object.isPro || false
      new_user.created = old_user_object.created || 0
      new_user.lastLogin = old_user_object.lastLogin || 0
      new_user.isNewUser = old_user_object.isNewUser || true
      new_user.sk32 = old_user_object.sk32
      new_user.adminMaps = [new_map]
      new_user.setVehicle = new_vehicle
      debug(`Set properties for new user ${new_user.id}`)

      // Delete old user
      try {
        var old_user_id = old_user.id
        await old_user.remove()
        debug(`Deleted old user ${old_user_id}`)
      } catch (err) {
        console.error(`Unable to delete old user ${old_user_id}:\n`,err.stack)
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
        console.error(`Unable to save new user, map, or vehicle:\n`,err.stack)
        reject(err)
      }

    }
  })
}
