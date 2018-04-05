/* global navigator $ socket token */

// On page load
$(function () {

  // Controls
  let wpid, newloc

  // Set location
  $('#set-loc').click(function () {

    // Check if logged in and enabled
    if (!setVehicleId.length) alert('You are not logged in! '); else {
      if (!navigator.geolocation) alert('Geolocation not enabled. '); else {

        navigator.geolocation.getCurrentPosition(

          // Success callback
          function (pos) {
            const newloc = {
              ts: Date.now(),
              tok: token,
              veh: setVehicleId,
              alt: pos.coords.altitude,
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              spd: (pos.coords.speed || 0)
            }
            socket.emit('set', newloc)
            console.log('Set location:', newloc.lat + ', ' + newloc.lon)
          },

          // Error callback
          function (err) {
            alert('Unable to set location.')
            //console.error(err.message)
          },

          // Options
          { enableHighAccuracy: true }

        )
      }
    }
  })

  // Track location
  $('#track-loc').click(function () {

    // Check if logged in and enabled
    if (!setVehicleId.length) alert('You are not logged in! '); else {
      if (!navigator.geolocation) alert('Geolocation not enabled. '); else {

        // Start tracking
        if (!wpid) {
          if (!navigator.geolocation) alert('Unable to track location. '); else {
            $('#track-loc').html(
              '<i class="fa fa-crosshairs fa-spin"></i>Stop'
            ).prop('title',
              'Click here to stop tracking your location. '
            )
            wpid = navigator.geolocation.watchPosition(

              // Success callback
              function (pos) {
                newloc = {
                  ts: Date.now(),
                  tok: token,
                  veh: setVehicleId,
                  lat: pos.coords.latitude,
                  lon: pos.coords.longitude,
                  alt: pos.coords.altitude,
                  spd: (pos.coords.speed || 0)
                }
                socket.emit('set', newloc)
                console.log('Set location:', newloc.lat + ', ' + newloc.lon)
              },

              // Error callback
              function (err) {
                alert('Unable to track location.')
                //console.error(err.message)
              },

              // Options
              { enableHighAccuracy: true }

            )
          }

        // Stop tracking
        } else {
          $('#track-loc').html('<i class="fa fa-crosshairs"></i>Track').prop('title', 'Click here to track your location. ')
          navigator.geolocation.clearWatch(wpid)
          wpid = undefined
        }

      }
    }
  })

  // Clear location
  $('#clear-loc').click(function () {
    if (!setVehicleId.length) alert('You are not logged in! '); else {

      // Stop tracking
      if (wpid) {
        $('#track-loc').html('<i class="fa fa-crosshairs"></i>Track')
        navigator.geolocation.clearWatch(wpid)
        wpid = undefined
      }

      // Clear location
      socket.emit('set', {
        ts: Date.now(),
        tok: token,
        veh: setVehicleId,
        lat: 0,
        lon: 0,
        spd: 0
      })
      console.log('Cleared location')
    }
  })

})