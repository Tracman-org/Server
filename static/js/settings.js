'use strict'
/* global $ confirm */

// Validate email addresses
function validateEmail (email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email)
}

// Replace inputed value with response
function replaceFromEndpoint (type, selector, cb) {
  $.get('/validate?' + type + '=' + $(selector).val())
  .done(function (data) {
    $(selector).val(data)
    cb()
  })
}

// On page load
$(function () {
  var slugNotUnique, emailNotUnique

  // Set timezone in password change link
  $('#password').attr('href', '/settings/password?tz=' + new Date().getTimezoneOffset())

  // Delete account
  $('#delete').click(function () {
    if (confirm('Are you sure you want to delete your account?  This CANNOT be undone! ')) {
      window.location.href = '/settings/delete'
    }
  })

  function validateForm (input) {
    // Perform basic check, then validate uniqueness
    basicCheck(function () { validateUniqueness(input) })

    function basicCheck (cb) {
      var checkedCount = 0

      // Check slug
      if (!$('#slug-input').val()) {
        $('#slug-help').show().text('A slug is required. ')
        $('#submit-group .main').prop('disabled', true).prop('title', 'You need to enter a slug. ')
        if (checkedCount > 0) { cb() } else { checkedCount++ }
      } else {
        if (!slugNotUnique) { $('#slug-help').hide() }
        if (checkedCount > 0) { cb() } else { checkedCount++ }
      }

      // Check email
      if (!$('#email-input').val()) {
        $('#email-help').show().text('An email is required. ')
        $('#submit-group .main').prop('disabled', true).prop('title', 'You need to enter an email address. ')
        if (checkedCount > 0) { cb() } else { checkedCount++ }
      } else if (!validateEmail($('#email-input').val())) {
        $('#email-help').show().text('You must enter a valid email address. ')
        $('#submit-group .main').prop('disabled', true).prop('title', 'You need to enter a valid email address. ')
        if (checkedCount > 0) { cb() } else { checkedCount++ }
      } else {
        if (!emailNotUnique) { $('#email-help').hide() }
        if (checkedCount > 0) { cb() } else { checkedCount++ }
      }
    }

    function validateUniqueness (input) {
      function recheckBasic () {
        if ($('#email-help').is(':visible') && $('#email-help').text().substring(0, 25) !== 'Unable to confirm unique ') {
          $('#submit-group .main').prop('disabled', true).prop('title', 'You need to supply a different email address. ')
        } else if ($('#slug-help').is(':visible') && $('#slug-help').text().substring(0, 25) !== 'Unable to confirm unique ') {
          $('#submit-group .main').prop('disabled', true).prop('title', 'You need to supply a different slug. ')
        } else if ($('#slug-help').text().substring(0, 25) === 'Unable to confirm unique ') {
          $('#submit-group .main').prop('title', 'Unable to confirm unique slug with the server. This might not work... ')
        } else if ($('#email-help').text().substring(0, 25) === 'Unable to confirm unique ') {
          $('#submit-group .main').prop('title', 'Unable to confirm unique email with the server. This might not work... ')
        } else {
          $('#submit-group .main').prop('disabled', false).prop('title', 'Click here to save your changes. ')
        }
      }

      // Should server be queried for unique values?
      if (input && $('#' + input + '-input').val()) {
        if (!input === 'email' || validateEmail($('#email-input').val())) {
         // Query server for unique values
          $.ajax({
            url: '/validate?' + input + '=' + $('#' + input + '-input').val(),
            type: 'GET',
            statusCode: {

            // Is unique
              200: function () {
                $('#' + input + '-help').hide()
                if (input === 'slug') { slugNotUnique = false } else if (input === 'email') { emailNotUnique = false }
                recheckBasic()
              },

            // Isn't unique
              400: function () {
                if (input === 'slug') { slugNotUnique = true } else if (input === 'email') { emailNotUnique = true }
                $('#' + input + '-help').show().text('That ' + input + ' is already in use by another user. ')
                $('#submit-group .main').prop('disabled', true).prop('title', 'You need to supply a different ' + input + '. ')
              }

            } })

          // Server error
          .error(function () {
            if (input === 'slug') { slugNotUnique = undefined } else if (input === 'email') { emailNotUnique = undefined }
            $('#' + input + '-help').show().text('Unable to confirm unique ' + input + '.  This might not work... ')
            recheckBasic()
          })
        }

      // Nothing changed.  Recheck basic validations
      } else { recheckBasic() }
    }
  }

  // Input change listeners
  $('#slug-input').change(function () {
    if (!$('#slug-input').val()) {
      $('#slug-help').show().text('A slug is required. ')
      $('#submit-group .main').prop('disabled', true).prop('title', 'You need to enter a slug. ')
    } else {
      $('#slug-help').hide()
      replaceFromEndpoint('slugify', '#slug-input', function () {
        validateForm('slug')
      })
    }
  })
  $('#email-input').change(function () {
    validateForm('email')
  })
  $('#name-input').change(function () {
    replaceFromEndpoint('xss', '#name-input', validateForm)
  })
})
