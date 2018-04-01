'use strict'
/* global $ confirm */

// Validate email addresses
function validateEmail (email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
}

// Replace inputed value with response
function replaceFromEndpoint (type, selector, cb) {
  $.get('/validate?' + type + '=' + $(selector).val())
  .done(function (data) {
    $(selector).val(data)
    if (typeof cb==='function') cb()
  })
}

// On page load
$(function () {

  // Listen for change to xss-sensitive values
  $('.xss-sensitive').change(function () {
    if ($(this).val()) {
      replaceFromEndpoint('xss', this)
    }
  })

})
