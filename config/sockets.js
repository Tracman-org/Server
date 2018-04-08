'use strict'

// Imports
const debug = require('debug')('tracman-sockets')
const sanitize = require('mongo-sanitize')
const User = require('./models').user
const Map = require('./models').map
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

      // Set a few variables
      socket.ip = socket.client.request.headers['x-real-ip']
      socket.ua = socket.client.request.headers['user-agent']
      debug(`${socket.ua} connected from ${socket.ip} as ${socket.id}`)

      // Log and errors
      //socket.on('log', (text) => {
        //debug(`LOG: ${text}`)
      //})
      //socket.on('error', (err) => { console.error(err) })

      // This socket can set location (setter)
      socket.on('can-set', async (user_id, token) => {
        if (user_id!==sanitize(user_id))
          console.error(Error(`Possible injection attempt with user_id of ${user_id}`).message)
        else if (token!==sanitize(token))
          console.error(Error(`Possible injection attempt with token of ${token}`).message)
        else if (!token)
          console.error(Error(`User ${user_id} wants to set location, but didn't send a token!`).message)
        else {
          try {
            const user = await User.findById(user_id).where('sk32',token)
            if (!user)
              console.error(Error(`Could not find a user with ID of ${user_id} and sk32 of ${token}!`).message)
            else {
              debug(`${socket.id} can set updates for user ${user.id}.`)
              const vehicles = await Vehicle.find({'setter':user_id})
              debug(`User sets location of ${vehicles.length} vehicles.`)
              if (vehicles.length) {
                socket.sets = []
                vehicles.forEach( async (vehicle) => {
                  const map = await Map.findOne({'vehicles':{$in:[vehicle.id]}})
                  if (!map)
                    console.error(Error(`Can't find map for vehicle ${vehicle.id}!`).message)
                  else {
                    socket.sets.push([map.id,vehicle.id])
                    socket.join(map.id, () => {
                      debug(`${socket.id} joined ${map.id}`)
                    })
                    checkForViewers(io, map.id)
                  }
                } )
              }
            }
          } catch (err) { console.error(err.message) }
        }
      })

      // This socket can receive location (map)
      socket.on('can-get', (map_id) => {
        socket.gets = map_id
        debug(`${socket.id} can get updates for ${map_id}.`)
        socket.join(map_id, () => {
          debug(`${socket.id} joined ${map_id}`)
          socket.to(map_id).emit('activate', 'true')
        })
      })

      // Set location
      socket.on('set', async (loc) => {
        debug(`${socket.id} is setting location for ${socket.sets.length} maps to: ${loc.lat}, ${loc.lon}`)

        // Get android timestamp or use server timestamp
        if (loc.ts) loc.tim = +loc.ts
        else loc.tim = Date.now()

        // Send location to each map
        socket.sets.forEach( (map_array) => {
          debug(`Sending location to map ${map_array[0]} for vehicle ${map_array[1]}...`)
          loc.veh = map_array[1]
          io.to(map_array[0]).emit('get', loc)
          // Save new location to sockets object (to save to DB on disconnect)
          socket.last = {
            lat: parseFloat(loc.lat),
            lon: parseFloat(loc.lon),
            dir: parseFloat(loc.dir || 0),
            spd: parseFloat(loc.spd || 0),
            alt: (loc.alt)? parseFloat(loc.alt): undefined,
            time: loc.tim,
          }
        })

      })

      // Shutdown (check for remaining clients)
      socket.on('disconnect', (reason) => {
        debug(`${socket.id} disconnected because of a ${reason}`)

        // Check if client was receiving updates
        if (socket.gets) {
          debug(`${socket.id} no longer gets ${socket.gets}`)
          // See if that was the last client
          checkForViewers(io, socket.gets)
        }

        // Check if client was setting updates
        if (socket.sets && socket.sets.length) {
          debug(`${socket.id} no longer sets for ${socket.sets.length} maps`)
          socket.sets.forEach( (map_array) => {

            // Set vehicle last
            try {
              debug(`Setting vehicle last for ${map_array[1]}...`)
              Vehicle.findByIdAndUpdate(map_array[1], {'last': socket.last})
            } catch (err) { console.error(err.message) }

            // Set map last if this socket's is more recent
            try {
              const map = Map.findById(map_array[0])
              if (socket.last.time>map.lastUpdate) {
                debug(`Setting map last for ${map.id}...`)
                map.update({'lastUpdate': socket.last})
              }
            } catch (err) { console.error(err.message) }

          } )
        }

      })

    })
  }

}
