'use strict'
/* global $ confirm */

// Validate email addresses
function validateEmail (email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email)
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
  
  // Listen for change to name (map or user)
  $('#name-input').change(function () {
    if ($('#name-input').val()) {
      replaceFromEndpoint('xss', '#name-input')
    }
  })
  
})
  