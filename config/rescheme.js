'use strict'

const User = require('./models').user
const Map = require('./models').map
const Vehicle = require('./models').vehicle
const debug = require('debug')('tracman-rescheme')

module.exports = function (old_user_id) {
  return new Promise( async (resolve, reject) => {
    const old_user = await User.findById(old_user_id)
    const old_user_object = old_user.toObject()

    // Confirm use of old schema
    if (!old_user_object.slug) {
      debug(`User ${old_user_object._id} does not have slug; not rescheming`)
      resolve(old_user)
    } else {
      debug(` Rescheming user ${old_user._id}...`)

      // Create new objects
      const new_vehicle = new Vehicle()
      const new_user = new User()
      const new_map = new Map()

      // Create new vehicle object
      new_vehicle.name = old_user_object.name
      new_vehicle.created = old_user_object.created || 0
      new_vehicle.last = old_user_object.last
      new_vehicle.marker = old_user_object.marker || 'red'
      new_vehicle.setter = new_user

      // Create new map object
      new_map.name = (old_user_object.name)? old_user_object.name+' Map' : old_user_object.slug+' map' || 'My map'
      new_map.slug = old_user_object.slug
      new_map.created = old_user_object.created || 0
      new_map.settings = {
        visibility: 'public',
        units: old_user_object.settings.units || 'standard',
        defaultMapType: old_user_object.settings.defaultMap || 'road',
        defaultZoom: old_user_object.settings.defaultZoom || 11,
        center: {
          type: 'follow',
          follow: new_vehicle.id, // Use id to prevent RangeError
          lat: (old_user_object.last)? old_user_object.last.lat : 0,
          lon: (old_user_object.last)? old_user_object.last.lon : 0,
        },
        canZoom: true,
        canPan: false,
        display: {
          scale: old_user_object.settings.showScale || false,
          speed: old_user_object.settings.showSpeed || false,
          alt: old_user_object.settings.showAlt || false,
          streetview: old_user_object.settings.showStreetview || false,
        },
      }
      new_map.subscription = {
        type: (old_user_object.isPro)?'basic':'free',
        payments: [],
      },
      new_map.lastUpdate = (old_user_object.last) ?
        old_user_object.last.time : undefined
      new_map.vehicles = [new_vehicle]
      new_map.admins = [old_user_object.email]


      // Create new user object
      new_user.name = old_user_object.name
      new_user.email = old_user_object.email,
      new_user.newEmail = old_user_object.newEmail,
      new_user.emailToken = old_user_object.emailToken,
      new_user.auth = (old_user_object.auth) ? 
        old_user_object.auth :
        { google: old_user_object.googleID },
      new_user.isAdmin = old_user_object.isAdmin || false
      new_user.created = old_user_object.created || 0
      new_user.lastLogin = old_user_object.lastLogin || 0
      new_user.isNewUser = old_user_object.isNewUser || true
      new_user.sk32 = old_user_object.sk32

      // Save new objects
      const saveObject = (obj, name) => {
        return new Promise( async (resolve, reject) => {
          try {
            await obj.save()
            debug(`Saved new ${name} ${obj._id}`)
            resolve()
          } catch (err) {
            console.error(`Unable to save new ${name}:\n`,err)
            reject(err)
          }
        })
      }

      // Delete old user
      const deleteOldUser = (old_user_id) => {
        return new Promise( async (resolve, reject) => {
          try {
            await old_user.remove()
            debug(`Deleted old user ${old_user_id}`)
            resolve()
          } catch (err) {
            console.error(`Unable to delete old user ${old_user_id}:\n`,err.stack)
            reject(err)
          }
        } )
      }

      try {
        
        // Delete old user
        await deleteOldUser(old_user._id)
        // await old_user.remove()
        
        // Save new objects
        await Promise.all([
          // new_user.save(),
          // new_map.save(),
          // new_vehicle.save(),
          saveObject(new_user,'user'),
          saveObject(new_map,'map'),
          saveObject(new_vehicle,'vehicle'),
        ])
        
        resolve()
      } catch (err) {
        reject(err)
      }

    }
  })
}
