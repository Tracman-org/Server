'use strict'

const mongoose = require('mongoose')
const unique = require('mongoose-unique-validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const debug = require('debug')('tracman-models')

const userSchema = new mongoose.Schema({
  name: {type: String},
  email: {type: String, unique: true},
  newEmail: String,
  emailToken: String,
  slug: {type: String, required: true, unique: true},
  auth: {
    password: String,
    passToken: String,
    passTokenExpires: Date,
    google: String,
    facebook: String,
    twitter: String
  },
  isAdmin: {type: Boolean, required: true, default: false},
  isPro: {type: Boolean, required: true, default: false},
  created: {type: Date, required: true},
  lastLogin: Date,
  settings: {
    units: {type: String, default: 'standard'},
    defaultMap: {type: String, default: 'road'},
    defaultZoom: {type: Number, default: 11},
    showScale: {type: Boolean, default: false},
    showSpeed: {type: Boolean, default: false},
    showTemp: {type: Boolean, default: false},
    showAlt: {type: Boolean, default: false},
    showStreetview: {type: Boolean, default: false},
    marker: {type: String, default: 'red'}
  },
  last: {
    time: Date,
    lat: {type: Number, default: 0},
    lon: {type: Number, default: 0},
    dir: {type: Number, default: 0},
    alt: {type: Number},
    spd: {type: Number, default: 0}
  },
  sk32: {type: String, required: true, unique: true}
}).plugin(unique)

/* User methods */
// Do not replace with arrow functions!
// https://stackoverflow.com/a/37875212

// Create email confirmation token
userSchema.methods.createEmailToken = function () {
  debug(`user.createEmailToken() called for ${user.id}`)
  let user = this

  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) return reject(err)
      if (buf) {
        debug(`Buffer ${buf.toString('hex')} created`)
        user.emailToken = buf.toString('hex')
        user.save()
        .then(() => {
          resolve(user.emailToken)
        })
        .catch(reject)
      }
    })
  })

}

// Create password reset token
userSchema.methods.createPassToken = function () {
  let user = this
  debug(`user.createPassToken() called for ${user.id}`)

  return new Promise((resolve, reject) => {

    // Reuse old token, resetting clock
    if (user.auth.passTokenExpires >= Date.now()) {
      debug(`Reusing old password token...`)
      user.auth.passTokenExpires = Date.now() + 3600000 // 1 hour
      user.save()
        .then(() => {
          resolve(user.auth.passToken, user.auth.passTokenExpires)
        })
        .catch(reject)

    // Create new token
    } else {
      debug(`Creating new password token...`)
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err)
        if (buf) {
          user.auth.passToken = buf.toString('hex')
          user.auth.passTokenExpires = Date.now() + 3600000 // 1 hour
          user.save()
          .then(() => {
            debug('successfully saved user in createPassToken')
            resolve(user.auth.passToken, user.auth.passTokenExpires)
          })
          .catch((err) => {
            debug('error saving user in createPassToken')
            reject(err)
          })
        }
      })
    }

  })

}

// Generate hash for new password and save it to the database
userSchema.methods.generateHashedPassword = function (password) {
  debug(`user.generateHashedPassword() called for ${this.id}`)

  // Delete token
  this.auth.passToken = undefined
  this.auth.passTokenExpires = undefined

  return new Promise((resolve, reject) => {

    // Generate hash
    bcrypt.genSalt(8, (err, salt) => {
      if (err) return reject(err)
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) return reject(err)
        this.auth.password = hash
        this.save()
          .then(resolve)
          .catch(reject)
      })
    })

  })
}

// Check for valid password
userSchema.methods.validPassword = function (password) {
  let user = this
  debug(`user.validPassword() called for ${user.id}`)

  return bcrypt.compare(password, user.auth.password)

}

module.exports = {
  'user': mongoose.model('User', userSchema)
}
