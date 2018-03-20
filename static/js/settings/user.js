'use strict'
/* global $ validateEmail replaceFromEndpoint */


// On page load
$(function () {
  let original_email = $('#email-input').val()

  // Delete account
  $('#delete').click(function () {
    if (
      confirm('Are you sure you want to delete your account?  This CANNOT be undone! ')
    ) {
      console.log($('#delete').attr('href'))
      //window.location.href = $('#delete').attr('href')
    }
  })

  // Listen for change to name
  $('#name-input').change(function () {
    if ($('#name-input').val()) {
      replaceFromEndpoint('xss', '#name-input')
    }
  })

  // Listen for change to email
  $('#email-input').change( function () {

    // Check email existence
    if (!$('#email-input').val()) {
      $('#email-help').show().text('You must enter an email address. ')
      $('#submit-group .main')
        .prop('disabled', true)
        .prop('title', 'You need to enter an email address above. ')

    // Check that email's different
    } else if ($('#email-input').val() === original_email) {
      $('#email-help').hide()
      $('#submit-group .main')
        .prop('disabled', false)
        .prop('title', 'Save your settings')

    // Check email validity
    } else if (!validateEmail($('#email-input').val())) {
      $('#email-help').show()
        .text('You must enter a valid email address. ')
      $('#submit-group .main')
        .prop('disabled', true)
        .prop('title', 'You need to enter a valid email address above. ')
    } else {

      // Sanitize against mongo injection
      // TODO: Do this client-side
      replaceFromEndpoint('mongo', '#email-input', function () {

        // Check server for uniqueness
        $.ajax({
          url: '/validate?email=' + $('#email-input').val(),
          type: 'GET',
          statusCode: {

            // Is unique
            200: function () {
              $('#email-help').hide()
              $('#submit-group .main')
                .prop('disabled', false)
                .prop('title', 'Save your settings')
            },

            // Isn't unique
            400: function () {
              $('#email-help').show()
                .text('That email is already in use by another account. ')
              $('#submit-group .main')
                .prop('disabled', true)
                .prop('title', 'Supply a different email above')
            }

          }

        // Server error
        }).fail(function () {
          $('#email-help').show()
            .text('Unable to confirm unique email.  Are you still connected to the internet?')
          $('#submit-group .main')
            .prop('disabled', false)
            .prop('title', 'Try to save your settings')
        })

      })

    }

  })

})