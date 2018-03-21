'use strict'
/* global $ validateEmail replaceFromEndpoint */

function checkSetterEmail(setter) {

  // Check all setter emails (as on page load)
  if (typeof setter==='undefined') {
    $('.vehicle-setter').each( function(i) {
      checkSetterEmail($(this))
    })
  } else {
    let setter_id = setter.attr('name').slice(15)

    // Show loading icon
    $('#vehicle-setter-denied-'+setter_id).hide()
    $('#vehicle-setter-confirmed-'+setter_id).hide()
    $('#vehicle-setter-checking-'+setter_id).show()

    // Check server for a user with that email
    $.get({
      url: '/validate?user=' + setter.val(),
      statusCode: {

        // Exists
        200: function () {
          $('#vehicle-setter-checking-'+setter_id).hide()
          $('#vehicle-setter-denied-'+setter_id).hide()
          $('#vehicle-setter-confirmed-'+setter_id).show()
          $('#submit-btn')
            .prop('disabled', false)
            .prop('title', 'Save your settings')
        },

        // Doesn't exist
        400: function () {
          $('#vehicle-setter-checking-'+setter_id).hide()
          $('#vehicle-setter-confirmed-'+setter_id).hide()
          $('#vehicle-setter-denied-'+setter_id).show()
          $('#submit-btn')
            .prop('disabled', true)
            .prop('title', 'All vehicle setters must represent real users above')
        }

      }

    // Server error
    }).fail(function () {
      $('#vehicle-setter-checking-'+setter_id).hide()
      $('#vehicle-setter-confirmed-'+setter_id).hide()
      $('#vehicle-setter-denied-'+setter_id).show()
      $('#submit-btn')
        .prop('disabled', false)
        .prop('title', 'Try to save your settings')
    })

  }
}

// On page load
$(function () {
  let original_slug = $('#slug-input').val()

  // Check emails of all setters
  checkSetterEmail()

  // Listen for change to slug
  $('#slug-input').change( function () {

    // Check slug existence
    if (!$('#slug-input').val()) {
      $('#slug-help').show().text('A URL is required. ')
      $('#submit-btn')
        .prop('disabled', true)
        .prop('title', 'You need to enter a URL above')

    // Check that slug's changed
    } else if ($('#slug-input').val() === original_slug) {
      $('#slug-help').hide()
      $('#submit-btn')
        .prop('disabled', false)
        .prop('title', 'Save your settings')
    } else {

      // Slugify and sanitize against mongo injection
      replaceFromEndpoint('slugify', '#slug-input', function () {

        // Check server for uniqueness
        $.get({
          url: '/validate?slug=' + $('#slug-input').val(),
          statusCode: {

            // Is unique
            200: function () {
              $('#slug-help').hide()
              $('#submit-btn')
                .prop('disabled', false)
                .prop('title', 'Save your settings')
            },

            // Isn't unique
            400: function () {
              $('#slug-help').show()
                .text('That URL is already in use by another map.')
              $('#submit-btn')
                .prop('disabled', true)
                .prop('title', 'Supply a different URL above')
            }

          }

        // Server error
        }).fail(function () {
          $('#email-help').show()
            .text('Unable to confirm unique URL.  Are you still connected to the internet?')
          $('#submit-btn')
            .prop('disabled', false)
            .prop('title', 'Try to save your settings')
        })

      })

    }
  })

  // Listen to changes to vehicle setter
  $('.vehicle-setter').change( function () {
    let setter_id = $(this).attr('name').slice(15)

    $('#vehicle-setter-checking-'+setter_id).show()

    // Check setter existence
    if (!$(this).val()) {
      $('#vehicle-setter-checking-'+setter_id).hide()
      $('#vehicle-setter-confirmed-'+setter_id).hide()
      $('#vehicle-setter-denied-'+setter_id).show()
      $('#submit-btn')
        .prop('disabled', true)
        .prop('title', 'You need to enter an email address for each vehicle setter')

    // Check validity of setter email
    } else if (!validateEmail($(this).val())) {
      $('#vehicle-setter-checking-'+setter_id).hide()
      $('#vehicle-setter-confirmed-'+setter_id).hide()
      $('#vehicle-setter-denied-'+setter_id).show()
      $('#submit-btn')
        .prop('disabled', true)
        .prop('title', 'All vehicle setters must have valid email addresses')

    // Check setter email
    } else checkSetterEmail($(this))

  })

})