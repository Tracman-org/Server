'use strict'
/* global $ validateEmail replaceFromEndpoint alertDanger */

const $vehicle_add_button = $('#vehicle-new')
const $new_vehicle_row = $vehicle_add_button.closest('tr')

function checkSetterEmail(setter, vehicle_id) {
  //console.log('checkSetterEmail('+setter+', '+vehicle_id+')')

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

  const original_slug = $('#slug-input').val()

  // Delete map
  $('#delete').click(function () {
    if (
      confirm('Are you sure you want to delete your this map and all associated vehicles?  This CANNOT be undone! ')
    ) {
      window.location.href = $('#delete').attr('href')
    }
  })

  // Set up tabs
  $('.container').easytabs()
  // Listen to click on entire tab, not just link
  $('.tab').click( function() {
    $('.container').easytabs('select', $(this).children('a').attr('href'))
  })

  // Check emails of all vehcicle setters
  checkSetterEmail()

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

  // Complain about static map center latitude that's out of range
  $('#center-static-coords input[name="staticLat"]').change( function() {
    const val = parseFloat($(this).val())
    if (val>90) $('#map-center-lat-help').show()
      .text('Latitudes are always less than 90.')
    else if (val<-90) $('#map-center-lat-help').show()
      .text('Latitudes are always greater than -90.')
    else $('#map-center-lat-help').hide()
  })
  // Complain about static map center longitude that's out of range
  $('#center-static-coords input[name="staticLon"]').change( function() {
    const val = parseFloat($(this).val())
    if (val>180) $('#map-center-lon-help').show()
      .text('Longitudes are always less than 180.')
    else if (val<-180) $('#map-center-lon-help').show()
      .text('Longitudes are always greater than -180.')
    else $('#map-center-lon-help').hide()
  })

  // Listen to changes to vehicle setter
  $('#vehicles-table').on('change', '.vehicle-setter', function () {
    const vehicle_id = $(this).attr('data-vehicle')
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
        if (vehicle_id==='new') $vehicle_add_button
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

  // Add vehicle
  function addVehicle() {
    //console.log('addVehicle() called')
    const icon_classes = $('#vehicle-setter-icon-new').attr('class')
    const new_setter = $('#vehicle-setter-new').val()

    // Hide the help
    $('#vehicles-help').hide()

    // Dim the new row
    $new_vehicle_row.css({
      'filter': 'alpha(opacity=50)',
      '-moz-opacity': '0.5',
      '-khtml-opacity': '0.5',
      'opacity': '0.5',
    })

    // Replace add button with loading icon
    $vehicle_add_button
      .addClass('fa-spinner fa-spin')
      .css('color','#FFF')
      .removeClass('green fa-plus-circle')
      .css('cursor','not-allowed')

    // New setter email doesn't exist
    if (!new_setter) {

      // Show the help
      $('#vehicles-help').show().text('A setter email is required')

      // Give setter email focus
      $('#setter-new').focus()

      // Undim the new row
      $new_vehicle_row.css({
        'filter': '',
        '-moz-opacity': '',
        '-khtml-opacity': '',
        'opacity': '',
      })

      // Replace loading icon with disabled add button
      $vehicle_add_button
        .addClass('green fa-plus-circle')
        .removeClass('fa-spinner fa-spin')
        .css('cursor', 'not-allowed')
        .attr('title', 'A setter email is required')

    // Check validity of setter email
    } else if (!validateEmail(new_setter)) {

      // Show the help
      $('#vehicles-help').show().text('That setter email is invalid. ')

      // Give setter email focus
      $('#setter-new').focus()

      // Undim the new row
      $new_vehicle_row.css({
        'filter': '',
        '-moz-opacity': '',
        '-khtml-opacity': '',
        'opacity': '',
      })

      // Replace loading icon with disabled add button
      $vehicle_add_button
        .addClass('green fa-plus-circle')
        .removeClass('fa-spinner fa-spin')
        .css('cursor', 'not-allowed')
        .attr('title', 'Enter a valid setter email')

    } else {

      // Send request
      //console.log('sending request to',window.location.pathname+'/vehicles/new/')
      $.post({
        url: window.location.pathname+'/vehicles/new/',
        data: {
          name: $('#vehicle-name-new').val(),
          setter: $('#vehicle-setter-new').val(),
          marker: $('#vehicle-marker-new').val(),
        },
        statusCode: {

          // Successfully added
          201: function(res) {
            //console.log('successfully added with res of:',res)

            // Add row
            $new_vehicle_row.before('<tr>\
              <td>\
                <input class="xss-sensitive" type="text" name="vehicleName-'+res.id+'" value="'+res.name+'" placeholder="Vehicle names are optional" title="The name of a vehicle appears when you mouseover or click on a marker on the map">\
              </td>\
              <td class="setter">\
                <input type="text" class="vehicle-setter left" data-vehicle="'+res.id+'" name="vehicleSetter-'+res.id+'" value="'+res.setter+'" placeholder="Enter an email" title="The email address of the user account that can set the vehicle\'s location">\
                <i id="vehicle-setter-icon-'+res.id+'" class="'+icon_classes+'"></i>\
              </td>\
              <td>\
                <select name="vehicleMarker-'+res.id+'" title="The color of the map marker">\
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
            checkSetterEmail($('.vehicle-setter[data-vehicle="'+res.id+'"]'),res.id)

            // Undim the new row
            $new_vehicle_row.css({
              'filter': '',
              '-moz-opacity': '',
              '-khtml-opacity': '',
              'opacity': '',
            })

            // Replace loading icon with add button
            $vehicle_add_button
              .addClass('green fa-plus-circle')
              .removeClass('fa-spinner fa-spin')
              .css('cursor','pointer')

            // Clear new row inputs and give focus
            $('#vehicle-name-new').val('').focus()
            $('#vehicle-setter-new').val('')
            $("#vehicle-marker-new").val('red')

          },

          400: function(res) {
            alertDanger(res.responseJSON.danger)
          },

        }
      }).fail( function() {

        // Show help
        $('#vehicles-help').show()
          .text('Failed to add vehicle.  Are you still conected to the internet?  ')

        // Undim the new row
        $new_vehicle_row.css({
          'filter': '',
          '-moz-opacity': '',
          '-khtml-opacity': '',
          'opacity': '',
        })

        // Replace loading icon with delete button
        $vehicle_add_button
          .addClass('green fa-plus-circle')
          .removeClass('fa-spinner fa-spin')
          .css('cursor','pointer')

      })

    }

  }

  // Listen to adding of vehicles
  $('#vehicle-new').click(addVehicle)
  // Intercept add vehicle form submission
  $('#vehicles form').submit( function(e) {
    //console.log('vehicle submit intercepted')
    // Add vehicle if new vehicle input has focus
    if ($('.new-vehicle-input').is(':focus')) {
      //console.log('new vehicle has focus')
      e.preventDefault()
      addVehicle()
    } else if ($('#vehicle-name-new').val()!==''||$('#vehicle-setter-new').val()!=='') {
      addVehicle()
    }
  })

  // Listen to deleting of vehicles
  $('#vehicles-table').on('click', '.vehicle-delete', function () {
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

  // Add admin
  function addAdmin() {
    //console.log('addAdmin() called')
    const $admin_add_button = $('#admin-new')
    const $new_admin_line = $admin_add_button.closest('li')
    const new_value = $('#admin-new-email').val()

    // Hide the help
    $('#admins-help').hide()

    // Dim the new row
    $new_admin_line.css({
      'filter': 'alpha(opacity=50)',
      '-moz-opacity': '0.5',
      '-khtml-opacity': '0.5',
      'opacity': '0.5',
    }).prop('disabled', true)

    // Replace add button with loading icon
    $admin_add_button
      .addClass('fa-spinner fa-spin')
      .css('color','#FFF')
      .removeClass('green fa-plus-circle')
      .css('cursor','not-allowed')

    // Empty input; show help
    if (!new_value) {
      $('#admins-help').show()
        .text('Type an email address in the box, then click here to add it')

      // Undim the new line
      $new_admin_line.css({
        'filter': '',
        '-moz-opacity': '',
        '-khtml-opacity': '',
        'opacity': '',
      })

      // Replace loading icon with add button
      $admin_add_button
        .addClass('green fa-plus-circle')
        .removeClass('fa-spinner fa-spin')
        .css('cursor','pointer')

    // Inbalid email
    } else if (!validateEmail(new_value)) {

      // Show help
      $('#admins-help').show()
        .text('That email address isn\'t valid')

      // Undim the new line
      $new_admin_line.css({
        'filter': '',
        '-moz-opacity': '',
        '-khtml-opacity': '',
        'opacity': '',
      })

      // Replace loading icon with add button
      $admin_add_button
        .addClass('green fa-plus-circle')
        .removeClass('fa-spinner fa-spin')
        .css('cursor','pointer')

    // Valid input
    } else {

      // Send request
      $.post({
        url: window.location.pathname+'/admins/',
        data: {
          email: $('#admin-new-email').val(),
        },
        statusCode: {

          // Successfully added
          201: function(res) {
            //console.log('admin',res.email,'added')

            // Add line
            $new_admin_line.before('<li>\
              '+res.email+' <a><i data-admin="'+res.email+'" class="admin-delete fa fa-times-circle red" title="Remove '+res.email+' from admins"></i></a>\
            </li>')

            // Undim the new line
            $new_admin_line.css({
              'filter': '',
              '-moz-opacity': '',
              '-khtml-opacity': '',
              'opacity': '',
            }).prop('disabled', false)

            // Replace loading icon with add button
            $admin_add_button
              .addClass('green fa-plus-circle')
              .removeClass('fa-spinner fa-spin')
              .css('cursor','pointer')

            // Clear new input and give focus
            $('#admin-new-email').val('').focus()

          },

          400: function(res) {
            alertDanger(res.responseJSON.danger)
          },

        }
      }).fail( function() {
        //console.log('Failed to add admin')

        // Show help
        $('#vehicles-help').show()
          .text('Failed to add admin.  Are you still conected to the internet?  ')

        // Undim the new row
        $new_admin_line.css({
          'filter': '',
          '-moz-opacity': '',
          '-khtml-opacity': '',
          'opacity': '',
        }).prop('disabled', false)

        // Replace loading icon with delete button
        $admin_add_button
          .addClass('green fa-plus-circle')
          .removeClass('fa-spinner fa-spin')
          .css('cursor','pointer')

        // Return focus to input
        $('#admin-new-email').focus()

      })

    }

  }
  // Add admin on button click
  $('#admin-new').click(addAdmin)
  // Add admin on enter key (form submit)
  $('#admins form').submit( function(e) {
    e.preventDefault()
    addAdmin()
  })

  // Listen to deleting of admins
  $('#admins-list').on('click', '.admin-delete', function () {
    const delete_button = $(this)
    const this_line = delete_button.closest('li')

    // Hide the help
    $('#admins-help').hide()
    // Dim the line
    this_line.css({
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
      url: window.location.pathname+'/admins/'+$(this).attr('data-admin'),
      statusCode: {

        // Successfully deleted
        200: function(res) {
          this_line.remove()
        },

      }
    }).fail( function() {

      // Show help
      $('#admins-help').show()
        .text('Failed to delete that admin.  Are you still conected to the internet?  ')

      // Undim the row
      this_line.css({
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

})
