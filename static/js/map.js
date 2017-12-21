'use strict'
/* global alert mapuser userid disp noHeader mapKey navigator token */

import io from 'socket.io-client'
import $ from 'jquery'
import loadGoogleMapsAPI from 'load-google-maps-api'

// Variables
var map, marker, elevator, newLoc
const mapElem = document.getElementById('map')
const socket = io('//' + window.location.hostname)
const IDLE_TIMEOUT = 300 // 5 minutes in seconds
var _idleSecondsCounter = 0

// Idle timeout listeners
function resetIdleSecondsCounter () {
  _idleSecondsCounter = 0
}
document.onclick = resetIdleSecondsCounter
document.onmousemove = resetIdleSecondsCounter
document.onkeypress = resetIdleSecondsCounter

// Disconnect socket.io if user is idle for longer than IDLE_TIMEOUT seconds
window.setInterval( function CheckIdleTime () {
  _idleSecondsCounter++
  // Disconnect idle user if still connected
  if (_idleSecondsCounter >= IDLE_TIMEOUT) {
    if (socket.connected) {
      console.log('Disconnecting because idle for more than',IDLE_TIMEOUT,'seconds.')
      socket.disconnect()
    }
  // Connect user if disconnected
  } else {
    if (!socket.connected) {
      console.log('Reconnecting the user because they are no longer idle.')
      socket.connect()
    }
  }
}, 1000)

// Convert to feet if needed
function metersToFeet (meters) {
  //console.log('metersToFeet('+meters+')')
  return (mapuser.settings.units === 'standard') ? (meters * 3.28084).toFixed() : meters.toFixed()
}

// socket.io stuff
socket
  .on('connect', function () {
    console.log('Connected!')

    // Can get location
    socket.emit('can-get', mapuser._id)

    // Can set location too
    if (mapuser._id === userid) socket.emit('can-set', userid)
  }).on('disconnect', function () {
    console.log('Disconnected!')
  }).on('error', function (err) {
    console.error(err.stack)
  })

// Show/hide map if location is set/unset
function toggleMaps (loc) {
  if (loc.lat === 0 && loc.lon === 0) {
    $('#map').hide()
    $('#view').hide()
    $('#notset').show()
  } else {
    $('#map').show()
    $('#view').show()
    $('#notset').hide()
  }
}

// On page load
$(function () {

  toggleMaps(mapuser.last)

  // Controls
  var wpid, newloc

  // Set location
  $('#set-loc').click(function () {

    // Check if logged in and enabled
    if (!userid === mapuser._id) alert('You are not logged in! '); else {
      if (!navigator.geolocation) alert('Geolocation not enabled. '); else {

        navigator.geolocation.getCurrentPosition(

          // Success callback
          function (pos) {
            var newloc = {
              ts: Date.now(),
              tok: token,
              usr: userid,
              alt: pos.coords.altitude,
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              spd: (pos.coords.speed || 0)
            }
            socket.emit('set', newloc)
            toggleMaps(newloc)
            console.log('Set location:', newloc.lat + ', ' + newloc.lon)
          },

          // Error callback
          function (err) {
            alert('Unable to set location.')
            console.error(err.stack)
          },

          // Options
          { enableHighAccuracy: true }

        )
      }
    }
  })

  // Track location
  $('#track-loc').click(function () {
    
    // Check for login
    if (!userid === mapuser._id) alert('You are not logged in! '); else {
      
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
                usr: userid,
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                alt: pos.coords.altitude,
                spd: (pos.coords.speed || 0)
              }
              socket.emit('set', newloc)
              toggleMaps(newloc)
              console.log('Set location:', newloc.lat + ', ' + newloc.lon)
            },

            // Error callback
            function (err) {
              alert('Unable to track location.')
              console.error(err.stack)
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
  })

  // Clear location
  $('#clear-loc').click(function () {
    if (!userid === mapuser._id) alert('You are not logged in! '); else {
      // Stop tracking
      if (wpid) {
        $('#track-loc').html('<i class="fa fa-crosshairs"></i>Track')
        navigator.geolocation.clearWatch(wpid)
        wpid = undefined
      }

      // Clear location
      newloc = {
        ts: Date.now(),
        tok: token,
        usr: userid,
        lat: 0,
        lon: 0,
        spd: 0
      }; socket.emit('set', newloc)

      // Turn off map
      toggleMaps(newloc)
      console.log('Cleared location')
    }
  })

})

// Load google maps API
loadGoogleMapsAPI({ key: mapKey })
.then(function (googlemaps) {

  // Create map
  if (disp !== '1') {
    // Create map and marker elements
    map = new googlemaps.Map(mapElem, {
      center: {
        lat: mapuser.last.lat,
        lng: mapuser.last.lon
      },
      panControl: false,
      scrollwheel: true,
      scaleControl: !!(mapuser.settings.showScale),
      draggable: false,
      zoom: mapuser.settings.defaultZoom,
      streetViewControl: false,
      zoomControlOptions: {position: googlemaps.ControlPosition.LEFT_TOP},
      mapTypeId: (mapuser.settings.defaultMap === 'road') ? googlemaps.MapTypeId.ROADMAP : googlemaps.MapTypeId.HYBRID
    })
    marker = new googlemaps.Marker({
      position: { lat: mapuser.last.lat, lng: mapuser.last.lon },
      title: mapuser.name,
      icon: (mapuser.settings.marker) ? '/static/img/marker/' + mapuser.settings.marker + '.png' : '/static/img/marker/red.png',
      map: map,
      draggable: false
    })
    map.addListener('zoom_changed', function () {
      map.setCenter(marker.getPosition())
    })

    // Create iFrame logo
    if (noHeader !== '0' && mapuser._id !== 'demo') {
      const logoDiv = document.createElement('div')
      logoDiv.id = 'map-logo'
      logoDiv.innerHTML = '<a href="https://tracman.org/">' +
        '<img src="https://tracman.org/static/img/style/logo-28.png" alt="[]">' +
        "<span class='text'>Tracman</span></a>"
      map.controls[googlemaps.ControlPosition.BOTTOM_LEFT].push(logoDiv)
    }

    // Create update time block
    const timeDiv = document.createElement('div')
    timeDiv.id = 'timestamp'
    if (mapuser.last.time) {
      timeDiv.innerHTML = 'location updated ' + new Date(mapuser.last.time).toLocaleString()
    }
    map.controls[googlemaps.ControlPosition.RIGHT_BOTTOM].push(timeDiv)

    // Create speed block
    if (mapuser.settings.showSpeed) {
      const speedSign = document.createElement('div')
      const speedLabel = document.createElement('div')
      const speedText = document.createElement('div')
      const speedUnit = document.createElement('div')
      speedLabel.id = 'spd-label'
      speedLabel.innerHTML = 'SPEED'
      speedText.id = 'spd'
      speedText.innerHTML = (mapuser.settings.units === 'standard') ? (parseFloat(mapuser.last.spd) * 2.23694).toFixed() : mapuser.last.spd.toFixed()
      speedUnit.id = 'spd-unit'
      speedUnit.innerHTML = (mapuser.settings.units === 'standard') ? 'm.p.h.' : 'k.p.h.'
      speedSign.id = 'spd-sign'
      speedSign.appendChild(speedLabel)
      speedSign.appendChild(speedText)
      speedSign.appendChild(speedUnit)
      map.controls[googlemaps.ControlPosition.TOP_RIGHT].push(speedSign)
    }

    // Create altitude block
    if (mapuser.settings.showAlt) {
      elevator = new googlemaps.ElevationService()
      const altitudeSign = document.createElement('div')
      const altitudeLabel = document.createElement('div')
      const altitudeText = document.createElement('div')
      const altitudeUnit = document.createElement('div')
      altitudeLabel.id = 'alt-label'
      altitudeText.id = 'alt'
      altitudeUnit.id = 'alt-unit'
      altitudeSign.id = 'alt-sign'
      altitudeText.innerHTML = ''
      altitudeLabel.innerHTML = 'ALTITUDE'
      parseAlt(mapuser.last).then(function (alt) {
        altitudeText.innerHTML = metersToFeet(alt)
      }).catch(function (err) {
        console.error('Could not load altitude from last known location: ', err)
      })
      altitudeUnit.innerHTML = (mapuser.settings.units === 'standard') ? 'feet' : 'meters'
      altitudeSign.appendChild(altitudeLabel)
      altitudeSign.appendChild(altitudeText)
      altitudeSign.appendChild(altitudeUnit)
      map.controls[googlemaps.ControlPosition.TOP_RIGHT].push(altitudeSign)
    }
  }

  // Create streetview
  if (disp !== '0' && mapuser.settings.showStreetview) {
    updateStreetView(parseLoc(mapuser.last), 10)
  }

  // Get altitude from Google API
  function getAlt (loc) {
    return new Promise(function (resolve, reject) {
      // Get elevator service
      elevator = elevator || new googlemaps.ElevationService()
      // Query API
      return elevator.getElevationForLocations({
        'locations': [{ lat: loc.lat, lng: loc.lon }]
      }, function (results, status, errorMessage) {
          // Success; return altitude
        if (status === googlemaps.ElevationStatus.OK && results[0]) {
          console.log('Altitude was retrieved from Google Elevations API as', results[0].elevation, 'm')
          resolve(results[0].elevation)

        // Unable to get any altitude
        } else reject(Error(errorMessage))
      })
    })
  }

  // Parse altitude
  function parseAlt (loc) {
    // console.log('parseAlt('+loc+'})')

    return new Promise(function (resolve, reject) {
      // Check if altitude was provided
      if (typeof loc.alt === 'number') {
        console.log('Altitude was provided in loc as ', loc.alt, 'm')
        resolve(loc.alt)

      // No altitude provided
      } else {
        console.log('No altitude was provided in loc')

        // Query google altitude API
        getAlt(loc).then(function (alt) {
          resolve(alt)
        }).catch(function (err) { reject(err) })
      }
    })
  }

  // Parse location
  function parseLoc (loc) {
    loc.spd = (mapuser.settings.units === 'standard') ? parseFloat(loc.spd) * 2.23694 : parseFloat(loc.spd)
    loc.dir = parseFloat(loc.dir)
    loc.lat = parseFloat(loc.lat)
    loc.lon = parseFloat(loc.lon)
    // loc.alt = parseAlt(loc);
    loc.tim = new Date(loc.tim).toLocaleString()
    return loc
  }

  // Got location
  socket.on('get', function (loc) {
    console.log('Got location:', loc.lat + ', ' + loc.lon)

    // Parse location
    newLoc = parseLoc(loc)

    // Update map
    if (disp !== '1') {
      // console.log('Updating map...')

      // Update time
      $('#timestamp').text('location updated ' + newLoc.tim)

      // Update marker and map center
      googlemaps.event.trigger(map, 'resize')
      map.setCenter({ lat: newLoc.lat, lng: newLoc.lon })
      marker.setPosition({ lat: newLoc.lat, lng: newLoc.lon })

      // Update speed
      if (mapuser.settings.showSpeed) $('#spd').text(newLoc.spd.toFixed())

      // Update altitude
      if (mapuser.settings.showAlt) {
        // console.log('updating altitude...');
        parseAlt(loc).then(function (alt) {
          $('#alt').text(metersToFeet(alt))
        }).catch(function (err) {
          $('#alt').text('????')
          console.error(err.stack)
        })
      }
    }

    // Update street view
    if (disp !== '0' && mapuser.settings.showStreetview) updateStreetView(newLoc, 10)

  })

  // Get street view imagery
  function getStreetViewData (loc, rad, cb) {
    // Ensure that the location hasn't changed (or this is the initial setting)
    if (newLoc == null || loc.tim === newLoc.tim) {
      if (!sv) var sv = new googlemaps.StreetViewService()
      sv.getPanorama({
        location: {
          lat: loc.lat,
          lng: loc.lon
        },
        radius: rad
      }, function (data, status) {
        switch (status) {
          // Success
          case googlemaps.StreetViewStatus.OK: {
            cb(data)
            break
          // No results in that radius
          } case googlemaps.StreetViewStatus.ZERO_RESULTS: {
            // Try again with a bigger radius
            getStreetViewData(loc, rad * 2, cb)
            break
          // Error
          } default:
            console.error(new Error('Street view not available: ' + status).message)
          }
        }
      })
    }
  }

  // Update streetview
  function updateStreetView (loc) {
    // Calculate bearing between user and position of streetview image
    // https://stackoverflow.com/a/26609687/3006854
    function getBearing (userLoc, imageLoc) {
      return 90 - (
        Math.atan2(userLoc.lat - imageLoc.latLng.lat(), userLoc.lon - imageLoc.latLng.lng()) *
        (180 / Math.PI)) % 360
    }

    // Get dimensions for sv request (images proportional to element up to 640x640)
    function getDimensions (element) {
      // Window is smaller than max
      if (element.width() < 640 && element.height() < 640) {
        return element.width().toFixed() + 'x' + element.height().toFixed()

      // Width must be made proportional to 640
      } else if (element.width() > element.height()) {
        return '640x' + (element.height() * 640 / element.width()).toFixed()

      // Height must be made proportional to 640
      } else return (element.width() * 640 / element.height()).toFixed() + 'x640'
    }

    // Set image
    getStreetViewData(loc, 2, function (data) {
      $('#viewImg').attr('src', 'https://maps.googleapis.com/maps/api/streetview?' +
        'size=' + getDimensions($('#view')) +
        '&location=' + data.location.latLng.lat() + ',' + data.location.latLng.lng() +
        '&fov=90' + // Inclination
        // Show direction if moving, point to user if stationary
        '&heading=' + ((loc.spd > 2) ? loc.dir : getBearing(loc, data.location)).toString() +
        '&key=' + mapKey
      )
    })
  }

// Error loading gmaps API
}).catch(function (err) {
  console.error(err.stack)
})
