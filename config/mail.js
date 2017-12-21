'use strict'

const nodemailer = require('nodemailer')
const env = require('./env/env.js')
const debug = require('debug')('tracman-mail')

let transporter = nodemailer.createTransport({
  host: env.mailserver,
  port: env.mailport,
  secure: false,
  requireTLS: true,
  auth: env.mailauth
  // logger: true,
  // debug: true
})

module.exports = {

  verify: () => {
    debug(`Verifying SMTP connection...`)

    return new Promise( (resolve, reject) => {
      transporter.verify()
      .then( (success) => {
        console.log(`  SMTP${(success)?'':' not'} ready`)
        resolve()
      }).catch( (err) => {
        console.log(err.stack)
        reject()
      })
    })

  },

  send: transporter.sendMail.bind(transporter),

  text: (text) => {
    return `Tracman\n\n${text}\n\nDo not reply to this email\nFor information about why you received this email, see the privacy policy at ${env.url}/privacyy#email`
  },

  html: (text)=>{
    return `<h1><a href="/" style="text-decoration:none;"><span style="color:#000;font-family:sans-serif;font-size:36px;font-weight:bold"><img src="${env.url}/static/img/icon/by/32.png" alt="+" style="margin-right:10px">Tracman</span></a></h1>${text}<p style="font-size:8px;">Do not reply to this email.  For information about why you recieved this email, see our <a href="${env.url}/privacy#email">privacy policy</a>. </p>`
  },

  noReply: '"Tracman" <NoReply@tracman.org>',

  to: (user) => {
    return `"${user.name}" <${user.email}>`
  }

}
