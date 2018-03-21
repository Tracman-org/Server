'use strict'
/* global $ replaceFromEndpoint */

// On page load
$(function () {
  let original_slug = $('#slug-input').val()

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

})