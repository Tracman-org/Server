'use strict'

// Imports
const debug = require('debug')('tracman-sockets')
const sanitize = require('mongo-sanitize')
const models = require('./models')

const User = models.user
const Map = models.map
const Vehicle = models.vehicle

// Check for tracking clients
function checkForViewers (io, map) {
  debug(`Checking for clients receiving updates for ${map}`)

  // Checks if any sockets are getting updates for this user
  if (Object.values(io.sockets.connected).some((socket) => {
    return socket.gets === map
  })) {
    debug(`Activating updates for ${map}.`)
    io.to(map).emit('activate', 'true')
  } else {
    debug(`Deactivating updates for ${map}.`)
    io.to(map).emit('activate', 'false')
  }
}

module.exports = {

  checkForUsers: checkForViewers,

  init: (io) => {
    io.on('connection', (socket) => {
      debug(`${socket.id} connected.`)

      // Set a few variables
      socket.ip = socket.client.request.headers['x-real-ip']
      socket.ua = socket.client.request.headers['user-agent']

      // Log and errors
      socket.on('log', (text) => {
        debug(`LOG: ${text}`)
      })
      socket.on('error', (err) => { console.error(err.stack) })

      // This socket can set location (app)
      socket.on('can-set', async (vehicleId) => {
        debug(`${socket.id} can set updates for ${vehicleId}.`)
        let map = await Map.findOne({'vehicles':{$in:[vehicleId]}})
        socket.join(map.id, () => {
          debug(`${socket.id} joined ${map.id}`)
        })
        checkForViewers(io, map.id)
      })

      // This socket can receive location (map)
      socket.on('can-get', (mapId) => {
        socket.gets = mapId
        debug(`${socket.id} can get updates for ${mapId}.`)
        socket.join(mapId, () => {
          debug(`${socket.id} joined ${mapId}`)
          socket.to(mapId).emit('activate', 'true')
        })
      })

      // Set location
      socket.on('set', async (loc) => {
        debug(`${socket.id} set location for ${loc.veh} to: ${loc.lat},${loc.lon}`)

        // Get android timestamp or use server timestamp
        if (loc.ts) loc.tim = +loc.ts
        else loc.tim = Date.now()

        // Look up vehicle if usr is supplied
        // (for backwards-compatibility with old android versions)
        if (loc.usr && !loc.veh) {
          try {
            let user = await User.findById(loc.usr)
            loc.veh = user.setVehicle
          } catch (err) {
            console.error(`Unable to look up vehicle for loc.usr of ${loc.usr}:\n${err.stack}`)
          }
        }

        // Check for vehicle and sk32 token
        if (!loc.veh) {
          console.error(
            new Error(
              `Recieved an update from ${socket.ip} without a veh or usr!`
            ).message
          )
        } else if (!loc.tok) {
          console.error(
            new Error(
              `Recieved an update from ${socket.ip} for usr ${loc.veh} without a token!`
            ).message
          )
        } else {
          try {
            // Get vehicle
            debug(`Finding vehicle with loc.veh ID of ${loc.veh} and sk32 of ${loc.tok}`)
            if (loc.veh !== sanitize(loc.veh)) {
              console.error(`Potential injection attempt with loc.veh of ${loc.veh}!`)
            } else {
              let vehicle = await Vehicle.findById(loc.veh).populate('setByUser')

              if (!vehicle) {
                console.error(
                  new Error(
                    `Recieved an update from ${socket.ip} for ${loc.veh}, but no such vehicle was found in the db!`
                  ).message
                )
              } else if (vehicle.setByUser.sk32 !== loc.tok) {
                console.error(
                  new Error(
                    `Recieved an update from ${socket.ip} for ${loc.veh} with a tok of ${loc.tok}, but the vehicle's user, ${vehicle.setByUser} has an sk32 of ${vehicle.setByUser.sk32}!`
                  ).message
                )
              } else {

                // Check that loc is newer than lastLoc
                debug(`Confirming that loc.tim of ${loc.tim} is newer than last of ${(vehicle.last.time)? vehicle.last.time.getTime(): vehicle.last.time}...`)
                if (!vehicle.last.time || loc.tim > vehicle.last.time.getTime()) {

                  // Find associated map
                  debug(`Finding map associated with vehicle ${vehicle.id}`)
                  let map = await Map.findOne({'vehicles':{$in:[vehicle.id]}})
                  debug(`Found map ${map.id}`)

                  // Broadcast location
                  debug(`Broadcasting ${loc.lat}, ${loc.lon} to ${map.id} for ${loc.veh}`)
                  io.to(map.id).emit('get', loc)

                  // Save new location in db
                  try {
                    vehicle.last = {
                      lat: parseFloat(loc.lat),
                      lon: parseFloat(loc.lon),
                      dir: parseFloat(loc.dir || 0),
                      spd: parseFloat(loc.spd || 0),
                      alt: (loc.alt)? parseFloat(loc.alt): undefined,
                      time: loc.tim,
                    }
                    await vehicle.save()
                    debug(`Saved new loc for ${vehicle.id}.`)
                  } catch (err) {
                    console.error(`Failed to save new location for vehicle ${vehicle.id} in db:\n${err.stack}`)
                  }
                  try {
                    map.lastUpdate = loc.tim
                    await map.save()
                    debug(`Saved new lastUpdate for ${map.id}.`)
                  } catch (err) {
                    console.error(`Failed to save new lastUpdate for map ${map.id} in db:\n${err.stack}`)
                  }

                }

              }
            }
          } catch (err) { console.error(err.stack) }
        }
      })

      // Shutdown (check for remaining clients)
      socket.on('disconnect', (reason) => {
        debug(`${socket.id} disconnected because of a ${reason}.`)

        // Check if client was receiving updates
        if (socket.gets) {
          debug(`${socket.id} left ${socket.gets}`)
          checkForViewers(io, socket.gets)
        }
      })
    })
  }

}
