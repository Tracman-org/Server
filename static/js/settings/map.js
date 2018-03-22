'use strict'
/* global $ validateEmail replaceFromEndpoint */

function checkSetterEmail(setter, vehicle_id) {

  // Check all setter emails (as on page load)
  if (typeof setter==='undefined') {
    $('.vehicle-setter').each( function(i) {
      checkSetterEmail($(this))
    })
  } else {
    if (typeof vehicle_id==='undefined') vehicle_id = setter.attr('data-vehicle')

    // Show loading icon
    $('#vehicle-setter-icon-'+vehicle_id)
      .removeClass('green fa-check red fa-times fa-exclamation')
      .addClass('fa-spinner fa-spin')
      .attr('title', 'Checking if a user has this email address')

    // Check server for a user with that email
    $.get({
      url: '/validate?user=' + setter.val(),
      statusCode: {

        // Exists
        200: function () {
          $('#vehicle-setter-icon-'+vehicle_id)
            .removeClass('red fa-times fa-exclamation fa-spinner fa-spin')
            .addClass('green fa-check')
            .attr('title', 'This email is associated with an existing user')
          $('#submit-btn')
            .prop('disabled', false)
            .prop('title', 'Save your settings')
        },

        // Doesn't exist
        404: function () {
          $('#vehicle-setter-icon-'+vehicle_id)
            .removeClass('green fa-check fa-exclamation fa-spinner fa-spin')
            .addClass('red fa-times')
            .attr('title', 'No Tracman user has this email')
          $('#submit-btn')
            .prop('disabled', true)
            .prop('title', 'All vehicle setters must represent real users above')
        }

      }

    // Server error
    }).fail(function () {
      $('#vehicle-setter-icon-'+vehicle_id)
        .removeClass('green fa-check fa-times fa-spinner fa-spin')
        .addClass('red fa-exclamation')
        .attr('title', 'Could not check if this email is associated with a Tracman user. Are you still connected to the internet?')
      $('#submit-btn')
        .prop('disabled', false)
        .prop('title', 'Try to save your settings')
    })

  }
}

// On page load
$(function () {
  const original_slug = $('#slug-input').val()

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
            204: function () {
              $('#slug-help').hide()
              $('#submit-btn')
                .prop('disabled', false)
                .prop('title', 'Save your settings')
            },

            // Is taken
            409: function () {
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
    const vehicle_id = $(this).attr('data-vehicle')
    const new_value = $(this).val()

    // Check setter existence
    if (!new_value) {
      $('#vehicle-setter-icon-'+vehicle_id)
        .removeClass('green fa-check fa-exclamation fa-spinner fa-spin')
        .addClass('red fa-times')
        .attr('title', 'An email is required!')
      $('#submit-btn')
        .prop('disabled', true)
        .prop('title', 'You need to enter an email address for each vehicle setter')

    // Check validity of setter email
    } else if (!validateEmail(new_value)) {
      $('#vehicle-setter-icon-'+vehicle_id)
        .removeClass('green fa-check fa-exclamation fa-spinner fa-spin')
        .addClass('red fa-times')
        .attr('title', 'That isn\'t a valid email address')
      $('#submit-btn')
        .prop('disabled', true)
        .prop('title', 'All vehicle setters must have valid email addresses')

    // Check setter email
    } else checkSetterEmail($(this), vehicle_id)

  })

  // Listen to deleting of vehicles
  $('.vehicle-delete').click(function () {
    const delete_button = $(this)
    const this_row = delete_button.closest('tr')

    // Hide the help
    $('#vehicles-help').hide()
    // Dim the row
    this_row.css({
      'filter': 'alpha(opacity=50)',
      '-moz-opacity': '0.5',
      '-khtml-opacity': '0.5',
      'opacity': '0.5',
    })
    // Replace delete button with loading icon
    delete_button
      .addClass('fa-spinner fa-spin')
      .css('color','#FFF')
      .removeClass('red fa-times-circle')
      .css('cursor','not-allowed')

    $.ajax({ type: 'DELETE',
      url: window.location.pathname+'/vehicles/'+$(this).attr('data-vehicle'),
      statusCode: {

        // Successfully deleted
        200: function(res) {
          this_row.remove()
        },

      }
    }).fail( function() {

      // Show help
      $('#vehicles-help').show()
        .text('Failed to delete that vehicle.  Are you still conected to the internet?  ')

      // Undim the row
      this_row.css({
        'filter': '',
        '-moz-opacity': '',
        '-khtml-opacity': '',
        'opacity': '',
      })
      // Replace loading icon with delete button
      delete_button
        .addClass('red fa-times-circle')
        .removeClass('fa-spinner fa-spin')
        .css('cursor','pointer')

    })

  })

  // Listen to adding of vehicles
  $('#vehicle-add').click(function() {

  })

})