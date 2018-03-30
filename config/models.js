'use strict'

const mongoose = require('mongoose')
const unique = require('mongoose-unique-validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const debug = require('debug')('tracman-models')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const userSchema = new Schema({
  name: String,
  email: { type:String, required:true, /*unique:true*/ }, //TODO: Make unique after rescheme
  newEmail: String,
  emailToken: String,
  auth: {
    password: String,
    passToken: String,
    passTokenExpires: Date,
    google: String,
    facebook: String,
    twitter: String,
  },
  isSiteAdmin: { type:Boolean, required:true, default:false },
  isPro: { type:Boolean, required:true, default:false },
  created: Date,
  lastLogin: Date,
  isNewUser: Boolean,
  sk32: { type:String, required:true },
}).plugin(unique)

const vehicleSchema = new Schema({
  name: String,
  created: Date,
  last: {
    time: Date,
    lat: { type:Number, default:0 },
    lon: { type:Number, default:0 },
    dir: { type:Number, default:0 },
    alt: { type:Number },
    spd: { type:Number, default:0 },
  },
  marker: { type:String, default:'red' },
  setterEmail: String, // Email of setter in case user doesn't exist yet
  setter: { type:ObjectId, ref:'User' },
})

const mapSchema = new Schema({
  name: String,
  created: Date,
  lastUpdate: Date,
  slug: { type:String, required:true, /*unique:true*/ }, //TODO: Make unique after rescheme
  settings: {
    units: { type:String, default:'standard' }, // 'standard' or 'metric'
    defaultMapType: { type:String, default:'road' }, // 'road' or 'sat'
    defaultZoom: { type:Number, default:11 },
    center: {
      type: { type:String, default:'follow' }, // 'static' or 'follow'
      follow: { type:ObjectId, ref:'Vehicle' },
      lat: { type:Number, default:0 },
      lon: { type:Number, default:0 },
    },
    canZoom: { type:Boolean, default:true },
    canPan: { type:Boolean, default:false },
    display: {
      scale: { type:Boolean, default:false },
      speed: { type:Boolean, default:false },
      alt: { type:Boolean, default:false },
      streetview: { type:Boolean, default:false },
    },
  },
  vehicles: [{ type:ObjectId, ref:'Vehicle' }],
  admins: [String], // Array of authorized emails
}).plugin(unique)

/* Middleware */
// Delete vehicles when a map is deleted
mapSchema.post('remove', (map) => {
  Vehicle.remove({_id: { $in: map.vehicles }})
})

/* User methods */
// Do not replace with arrow functions!
// https://stackoverflow.com/a/37875212

// Create email confirmation token
userSchema.methods.createEmailToken = function () {
  debug(`user.createEmailToken() called for ${this.id}`)
  const user = this

  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, async (err, buf) => {
      if (err) return reject(err)
      if (buf) {
        debug(`Buffer ${buf.toString('hex')} created`)
        user.emailToken = buf.toString('hex')
        try {
          await user.save()
          resolve(user.emailToken)
        } catch (err) { reject(err) }
      }
    })
  })

}

// Create password reset token
userSchema.methods.createPassToken = function () {
  const user = this
  debug(`user.createPassToken() called for ${user.id}`)

  return new Promise( async (resolve, reject) => {

    // Reuse old token
    if (user.auth.passTokenExpires >= Date.now()) {
      debug(`Reusing old password token...`)
      resolve([user.auth.passToken, user.auth.passTokenExpires])

    // Create new token
    } else {
      debug(`Creating new password token...`)
      crypto.randomBytes(16, async (err, buf) => {
        if (err) return reject(err)
        if (buf) {
          user.auth.passToken = buf.toString('hex')
          user.auth.passTokenExpires = Date.now() + 3600000 // 1 hour
          try {
            await user.save()
            debug('Successfully saved user in createPassToken')
            resolve([user.auth.passToken, user.auth.passTokenExpires])
          } catch (err) {
            debug('Error saving user in createPassToken')
            reject(err)
          }
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
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) return reject(err)
        this.auth.password = hash
        try {
          await this.save()
          resolve()
        } catch (err) { reject() }
      })
    })

  })
}

// Check for valid password
userSchema.methods.validPassword = function (password) {
  const user = this
  debug(`user.validPassword() called for ${user.id}`)
  return bcrypt.compare(password, user.auth.password)
}

// Set models outside exports for populate
const User = mongoose.model('User', userSchema)
const Map = mongoose.model('Map', mapSchema)
const Vehicle = mongoose.model('Vehicle', vehicleSchema)

module.exports = {
  'user': User,
  'map': Map,
  'vehicle': Vehicle,
}
