'use strict'
/* global $ validateEmail replaceFromEndpoint */

function checkSetterEmail(setter, vehicle_id) {

  // Check all setter emails (as on page load)
  if (typeof setter==='undefined') {
    $('.vehicle-setter').each( function(i) {
      if ($(this).attr('data-vehicle')) { // Ignore new
        checkSetterEmail($(this), $(this).attr('data-vehicle'))
      }
    })

  // Check single setter
  } else {

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
        },

        // Doesn't exist
        404: function () {
          $('#vehicle-setter-icon-'+vehicle_id)
            .removeClass('green fa-check fa-exclamation fa-spinner fa-spin')
            .addClass('red fa-times')
            .attr('title', 'No Tracman user has this email')
        }

      }

    // Server error
    }).fail(function () {
      $('#vehicle-setter-icon-'+vehicle_id)
        .removeClass('green fa-check fa-times fa-spinner fa-spin')
        .addClass('red fa-exclamation')
        .attr('title', 'Could not check if this email is associated with a Tracman user. Are you still connected to the internet?')
    })

  }
}

function dimCenterInputs() {

  // Follow
  if ($('#center-follow-radio').is(':checked')) {

    // Activate followed vehicle
    $('#center-follow-vehicle')
    .css({
      'filter': '',
      '-moz-opacity': '',
      '-khtml-opacity': '',
      'opacity': '',
    })
    .prop('disabled', false)

    // Deactivate static coordinantes
    $('#center-static-coords input')
    .css({
      'filter': 'alpha(opacity=50)',
      '-moz-opacity': '0.5',
      '-khtml-opacity': '0.5',
      'opacity': '0.5',
    })
    .prop('disabled', true)

  // Static
  } else if ($('#center-static-radio').is(':checked')) {

    // Deactivate followed vehicle
    $('#center-follow-vehicle')
    .css({
      'filter': 'alpha(opacity=50)',
      '-moz-opacity': '0.5',
      '-khtml-opacity': '0.5',
      'opacity': '0.5',
    })
    .prop('disabled', true)

    // Activate static coordinantes
    $('#center-static-coords input')
    .css({
      'filter': '',
      '-moz-opacity': '',
      '-khtml-opacity': '',
      'opacity': '',
    })
    .prop('disabled', false)

  }
}

// On page load
$(function () {

  // Set up tabs
  $('.container').easytabs()
  // Listen to click on entire tab, not just link
  $('.tab').click( function() {
    $('.container').easytabs('select', $(this).children('a').attr('href'))
  })

  const original_slug = $('#slug-input').val()

  // Listen for change to slug
  $('#slug-input').change( function () {

    // Check slug existence
    if (!$('#slug-input').val()) {
      $('#slug-help').show().text('A URL is required. ')
      $('#basics .submit.btn')
        .prop('disabled', true)
        .attr('title', 'You need to enter a URL above')

    // Check that slug's changed
    } else if ($('#slug-input').val() === original_slug) {
      $('#slug-help').hide()
      $('#basics .submit.btn')
        .prop('disabled', false)
        .attr('title', 'Save your settings')
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
              $('#basics .submit.btn')
                .prop('disabled', false)
                .attr('title', 'Save your settings')
            },

            // Is taken
            409: function () {
              $('#slug-help').show()
                .text('That URL is already in use by another map.')
              $('#basics .submit.btn')
                .prop('disabled', true)
                .attr('title', 'Supply a different URL above')
            }

          }

        // Server error
        }).fail(function () {
          $('#email-help').show()
            .text('Unable to confirm unique URL.  Are you still connected to the internet?')
          $('#basics .submit.btn')
            .prop('disabled', false)
            .attr('title', 'Try to save your settings')
        })

      })

    }
  })

  // Dim inactive map center inputs
  dimCenterInputs()
  $('#map-center .button.col input').change(dimCenterInputs)

  // Check emails of all vehcicle setters
  checkSetterEmail()

  // Listen to changes to vehicle setter
  $('table').on('change', '.vehicle-setter', function () {
    let vehicle_id = $(this).attr('data-vehicle')
    if (typeof vehicle_id==='undefined') vehicle_id = 'new'
    const new_value = $(this).val()

    // Check setter existence
    if (!new_value) {

      // If new, hide icon
      if (vehicle_id==='new') $('#vehicle-setter-icon-'+vehicle_id).hide()

      else {
        // Change setter icon
        $('#vehicle-setter-icon-'+vehicle_id)
          .removeClass('green fa-check fa-exclamation fa-spinner fa-spin')
          .addClass('red fa-times')
          .attr('title', 'An email is required!')
        // Disable new button
        if (vehicle_id==='new') $('#vehicle-new')
          .css('cursor', 'not-allowed')
          .attr('title', 'A setter email is required')
      }

    // Check validity of setter email
    } else if (!validateEmail(new_value)) {
      // Change setter icon
      $('#vehicle-setter-icon-'+vehicle_id)
        .removeClass('green fa-check fa-exclamation fa-spinner fa-spin')
        .addClass('red fa-times')
        .attr('title', 'That email address isn\'t valid')
      // Disable new button
      if (vehicle_id==='new') $('#vehicle-new')
        .css('cursor', 'not-allowed')
        .attr('title', 'That email address isn\'t valid')

    } else {
      // Check setter email
      checkSetterEmail($(this), vehicle_id)
      // Enable new button
      if (vehicle_id==='new') $('#vehicle-new')
        .css('cursor', 'pointer')
        .attr('title', 'Click to add a new vehicle')
    }

  })

  // Listen to deleting of vehicles
  $('table').on('click', '.vehicle-delete', function () {
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

    // Send request
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
  $('#vehicle-new').click( function() {
    const add_button = $(this)
    const new_row = $(this).closest('tr')
    const icon_classes = ($('#vehicle-setter-icon-new').attr('class'))

    // Hide the help
    $('#vehicles-help').hide()

    // Dim the new row
    new_row.css({
      'filter': 'alpha(opacity=50)',
      '-moz-opacity': '0.5',
      '-khtml-opacity': '0.5',
      'opacity': '0.5',
    })

    // Replace add button with loading icon
    add_button
      .addClass('fa-spinner fa-spin')
      .css('color','#FFF')
      .removeClass('green fa-plus-circle')
      .css('cursor','not-allowed')

    // Send request
    $.post({
      url: window.location.pathname+'/vehicles/',
      data: {
        name: $('#vehicle-name-new').val(),
        setter: $('#vehicle-setter-new').val(),
        marker: $('#vehicle-marker-new').val(),
      },
      statusCode: {

        // Successfully added
        201: function(res) {

          // Add row
          new_row.before('<tr>\
            <td>\
              <input class="xss-sensitive" type="text" name="vehicle-name-'+res.id+'" value="'+res.name+'" placeholder="Vehicle names are optional" title="The name of a vehicle appears when you mouseover or click on a marker on the map">\
				    </td>\
  					<td class="setter">\
  						<input type="text" class="vehicle-setter left" data-vehicle="'+res.id+'" name="vehicle-setter-'+res.id+'" value="'+res.setter+'" placeholder="Enter an email" title="The email address of the user account that can set the vehicle\'s location">\
  						<i id="vehicle-setter-icon-'+res.id+'" class="'+icon_classes+'"></i>\
  					</td>\
  					<td>\
  						<select name="marker-'+res.id+'" title="The color of the map marker">\
  							<option '+((res.marker==='red')?'selected ':'')+'value="red">red</option>\
  							<option '+((res.marker==='black')?'selected ':'')+'value="black">black</option>\
  							<option '+((res.marker==='green')?'selected ':'')+'value="green">green</option>\
  							<option '+((res.marker==='grey')?'selected ':'')+'value="grey">grey</option>\
  							<option '+((res.marker==='orange')?'selected ':'')+'value="orange">orange</option>\
  							<option '+((res.marker==='purple')?'selected ':'')+'value="purple">purple</option>\
  							<option '+((res.marker==='white')?'selected ':'')+'value="white">white</option>\
  							<option '+((res.marker==='yellow')?'selected ':'')+'value="yellow">yellow</option>\
  						</select>\
  					</td>\
  					<td>\
  						<a><i data-vehicle="'+res.id+'" class="vehicle-delete fa fa-times-circle red"></i></a>\
  					</td>\
				  </tr>')

				  // Check setter
				  checkSetterEmail($('.vehicle-setter[data-vehicle="'+res.id+'"]'))

		      // Undim the new row
          new_row.css({
            'filter': '',
            '-moz-opacity': '',
            '-khtml-opacity': '',
            'opacity': '',
          })

          // Replace loading icon with add button
          add_button
            .addClass('green fa-plus-circle')
            .removeClass('fa-spinner fa-spin')
            .css('cursor','pointer')

          // Clear new row inputs
          $('#vehicle-name-new').val('')
          $('#vehicle-setter-new').val('')
          $("#vehicle-marker-new").val('red')

        },

      }
    }).fail( function() {

      // Show help
      $('#vehicles-help').show()
        .text('Failed to add vehicle.  Are you still conected to the internet?  ')

      // Undim the new row
      new_row.css({
        'filter': '',
        '-moz-opacity': '',
        '-khtml-opacity': '',
        'opacity': '',
      })

      // Replace loading icon with delete button
      add_button
        .addClass('green fa-plus-circle')
        .removeClass('fa-spinner fa-spin')
        .css('cursor','pointer')

    })

  })

})