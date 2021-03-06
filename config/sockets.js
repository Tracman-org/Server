'use strict'

// Imports
const debug = require('debug')('tracman-sockets')
const sanitize = require('mongo-sanitize')
const User = require('./models.js').user

// Check for tracking clients
function checkForUsers (io, user) {
  debug(`Checking for clients receiving updates for ${user}`)

  // Checks if any sockets are getting updates for this user
  if (Object.values(io.sockets.connected).some((socket) => {
    return socket.gets === user
  })) {
    debug(`Activating updates for ${user}.`)
    io.to(user).emit('activate', 'true')
  } else {
    debug(`Deactivating updates for ${user}.`)
    io.to(user).emit('activate', 'false')
  }
}

module.exports = {

  checkForUsers: checkForUsers,

  init: (io) => {
    io.on('connection', (socket) => {
      debug(`${socket.ip||socket.id} connected.`)

      // Set a few variables
      socket.ip = socket.client.request.headers['x-real-ip'];
      socket.ua = socket.client.request.headers['user-agent'];

      // Log and errors
      socket.on('log', (text) => {
        debug(`LOG: ${text}`)
      })
      socket.on('error', (err) => { console.error(err.stack) })

      // This socket can set location (app)
      socket.on('can-set', (userId) => {
        debug(`${socket.ip} can set updates for ${userId}.`)
        socket.join(userId, () => {
          debug(`${socket.ip} joined ${userId} with ${socket.ua}`)
        })
        checkForUsers(io, userId)
      })

      // This socket can receive location (map)
      socket.on('can-get', (userId) => {
        socket.gets = userId
        debug(`${socket.ip} can get updates for ${userId}.`)
        socket.join(userId, () => {
          debug(`${socket.ip} joined ${userId}`)
          socket.to(userId).emit('activate', 'true')
        })
      })

      // Set location
      socket.on('set', async (loc) => {
        debug(`${socket.ip} set location for ${loc.usr}`)
        debug(`Location was set to: ${JSON.stringify(loc)}`)

        // Get android timestamp or use server timestamp
        if (loc.ts) loc.tim = +loc.ts
        else loc.tim = Date.now()

        // Check for user and sk32 token
        if (!loc.usr) {
          console.error(
            new Error(
              `Recieved an update from ${socket.ip} without a usr!`
            ).message
          )
        } else if (!loc.tok) {
          console.error(
            new Error(
              `Recieved an update from ${socket.ip} for usr ${loc.usr} without an sk32!`
            ).message
          )
        } else {
          try {
            // Get loc.usr
            let user = await User.findById(sanitize(loc.usr))
              .where('sk32').equals(loc.tok)

            if (!user) {
              console.error(
                new Error(
                  `Recieved an update from ${socket.ip} for ${loc.usr} with \
                  tok of ${loc.tok}, but no such user was found in the db!`
                ).message
              )
            } else {

              // Check that loc is newer than lastLoc
              debug(`Checking that loc of ${loc.tim} is newer than last of 
                ${(user.last.time)?user.last.time.getTime():user.last.time}...`)
              if (!user.last.time || loc.tim > user.last.time.getTime()) {

                // Broadcast location
                io.to(loc.usr).emit('get', loc)
                debug(`Broadcasting ${loc.lat}, ${loc.lon} to ${loc.usr}`)

                // Save in db as last seen
                user.last = {
                  lat: parseFloat(loc.lat),
                  lon: parseFloat(loc.lon),
                  dir: parseFloat(loc.dir || 0),
                  spd: parseFloat(loc.spd || 0),
                  time: loc.tim
                }
                user.save()

              }

            }
          } catch (err) { console.error(err.stack) }
        }
      })

      // Shutdown (check for remaining clients)
      socket.on('disconnect', (reason) => {
        debug(`${socket.ip} disconnected ${socket.ua} because of a ${reason}.`)

        // Check if client was receiving updates
        if (socket.gets) {
          debug(`${socket.ip} left ${socket.gets}`)
          checkForUsers(io, socket.gets)
        }
      })
    })
  }

}
