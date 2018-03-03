'use strict'

// Imports
const debug = require('debug')('tracman-sockets')
const Vehicle = require('./models').vehicle

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
      socket.ip = socket.client.request.headers['x-real-ip'];
      //socket.ua = socket.client.request.headers['user-agent'];

      // Log and errors
      //socket.on('log', (text) => {
      //  debug(`LOG: ${text}`)
      //})
      //socket.on('error', (err) => { console.error(err.stack) })

      // This socket can set location (app)
      socket.on('can-set', async (vehicleId) => {
        debug(`${socket.id} can set updates for ${vehicleId}.`)
        let map = await Map.findOne({'vehicles._id':vehicleId})[0]
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
        debug(`${socket.id} set location for ${loc.veh} to: ${JSON.stringify(loc)}`)

        // Get android timestamp or use server timestamp
        if (loc.ts) loc.tim = +loc.ts
        else loc.tim = Date.now()

        // Check for user and sk32 token
        if (!loc.veh) {
          console.error(
            new Error(
              `Recieved an update from ${socket.ip} without a veh!`
            ).message
          )
        } else if (!loc.tok) {
          console.error(
            new Error(
              `Recieved an update from ${socket.ip} for usr ${loc.veh} without an sk32!`
            ).message
          )
        } else {
          try {
            // Get loc.veh
            let vehicle = await Vehicle.findById(loc.veh)
              .where('sk32').equals(loc.tok)

            if (!vehicle) {
              console.error(
                new Error(
                  `Recieved an update from ${socket.ip} for ${loc.veh} with tok of ${loc.tok}, but no such vehicle was found in the db!`
                ).message
              )
            } else {

              // Check that loc is newer than lastLoc
              debug(`Checking that loc of ${loc.tim} is newer than last of
                ${(vehicle.last.time)? vehicle.last.time.getTime(): vehicle.last.time}...`)
              if (!vehicle.last.time || loc.tim > vehicle.last.time.getTime()) {

                // Find associated map
                let map = await Map.findOne({'vehicles._id':vehicle.id})[0]

                // Broadcast location
                io.to(map.id).emit('get', loc)
                debug(`Broadcasting ${loc.lat}, ${loc.lon} to ${map} for ${loc.veh}`)

                // Save in db as last seen
                vehicle.last = {
                  lat: parseFloat(loc.lat),
                  lon: parseFloat(loc.lon),
                  dir: parseFloat(loc.dir || 0),
                  spd: parseFloat(loc.spd || 0),
                  time: loc.tim
                }
                vehicle.save()
                map.lastUpdate = loc.tim
                map.save()

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
