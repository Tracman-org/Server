'use strict'
/* global alert io google $ mapData userid token disp noHeader mapKey */


// Variables
let map, elevator, parsed_loc, setVehicleId, initial_followed_center, selected_vehicle
const markers = {}
const map_element = document.getElementById('map')
const socket = io('//' + window.location.hostname)
const IDLE_TIMEOUT = 300 // 5 minutes
let _idleSecondsCounter = 0

// Iterate through vehicles
for (var i=0; i<mapData.vehicles.length; i++) {
  // Find vehicle to set
  if (mapData.vehicles[i].setter===userid) {
    setVehicleId = mapData.vehicles[i].setter
    console.log('Determined set vehicle as',setVehicleId)
  }
  if (mapData.vehicles[i]._id===mapData.settings.center.follow) {
    initial_followed_center = {
      lat: parseFloat(mapData.vehicles[i].last.lat) || 0,
      lng: parseFloat(mapData.vehicles[i].last.lon) || 0,
    }
    console.log('Set initial followed center to',initial_followed_center)
  }
}

// Idle timeout listeners
function resetIdleCounter () {
  _idleSecondsCounter = 0
  // Hide mask
  $('#inactive-mask').hide()
  $('#inactive-message').hide()
}
document.onclick = resetIdleCounter
document.onmousemove = resetIdleCounter
document.onkeypress = resetIdleCounter

// Disconnect socket.io if user is idle for longer than IDLE_TIMEOUT seconds
window.setInterval( function checkIdleTime () {
  // Disconnect idle user if still connected
  if (_idleSecondsCounter >= IDLE_TIMEOUT && socket.connected) {
    console.log('Disconnecting because idle for more than',IDLE_TIMEOUT,'seconds.')
    $('#inactive-mask').show()
    $('#inactive-message').show()
    socket.disconnect()
  // Reconnect if disconnected
  } else if (_idleSecondsCounter <= IDLE_TIMEOUT && !socket.connected) {
    console.log('Reconnecting...')
    socket.connect()
  }
  _idleSecondsCounter++
}, 1000)

// Convert to feet if needed
function convertMeters (meters) {
  console.log('convertMeters('+meters+')')
  return (mapData.settings.units === 'standard')?
    (meters * 3.28084).toFixed():
    meters.toFixed()
}

// socket.io stuff
socket
  .on('connect', function () {
    console.log('Connected!')
    // Can get location
    socket.emit('can-get', mapData._id)
    // Can set location too
    if (setVehicleId) socket.emit('can-set', userid, token)
  })//.on('disconnect', function () {
    console.log('Disconnected!')
  //}).on('error', function (err) {
    //console.error(err)
  //})

// Load google maps API
function initMap() {

  // Create map
  if (disp !== '1') {

    // Create map
    map = new google.maps.Map(map_element, {
      center: (mapData.settings.center.type==='static')? {
        lat:  mapData.settings.center.lat,
        lng: mapData.settings.center.lon,
      } : initial_followed_center,
      panControl: !!(mapData.settings.canPan),
      scrollwheel: !!(mapData.settings.canZoom),
      scaleControl: !!(mapData.settings.showScale),
      draggable: false,
      zoom: mapData.settings.defaultZoom || 11,
      streetViewControl: false,
      zoomControl: !!(mapData.settings.canZoom),
      zoomControlOptions: {position: google.maps.ControlPosition.LEFT_TOP},
      mapTypeId: (mapData.settings.defaultMapType==='sat')?
        google.maps.MapTypeId.HYBRID :
        google.maps.MapTypeId.ROADMAP
    })

    // Iterate through vehicles
    mapData.vehicles.forEach( function(vehicle) {

      // Create marker
      console.log('Creating marker for',vehicle._id)
      markers[vehicle._id] = new google.maps.Marker({
        position: { lat: vehicle.last.lat, lng: vehicle.last.lon },
        title: vehicle.name,
        icon: (vehicle.marker)?
          '/static/img/marker/' + vehicle.marker + '.png':
          '/static/img/marker/red.png',
        map: map,
        draggable: false
      })

      // Listen to clicking on vehicle
      markers[vehicle._id].addListener('click', function(){
        selected_vehicle = vehicle._id

        // Show and set speed sign
        if (mapData.settings.showSpeed) {
          $('#spd').text(this.speed)
          $('spd-sign').show()
        }

        // Show and set altitude sign
        if (mapData.settings.showAlt) {
          $('#alt').text(this.altitude)
          $('#alt-sign').show()
        }

        // Center map on that vehicle if panning is enabled
        if (!!(mapData.settings.canPan)) map.setCenter(this.getPosition())

      })

    } )

    // Move center if following
    if (!!(mapData.settings.canZoom)) {
      map.addListener('zoom_changed', function () {
        map.setCenter(markers[mapData.settings.center.follow].getPosition())
      })
    }

    // Create iFrame logo
    if (noHeader !== '0' && mapData._id !== 'demo') {
      const logoDiv = document.createElement('div')
      logoDiv.id = 'map-logo'
      logoDiv.innerHTML = '<a href="https://www.tracman.org/">' +
        '<img src="https://www.tracman.org/static/img/style/logo-28.png" alt="[]">' +
        "<span class='text'>Tracman</span></a>"
      map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(logoDiv)
    }

    // Create update time block
    const timeDiv = document.createElement('div')
    timeDiv.id = 'timestamp'
    if (mapData.lastUpdate) {
      timeDiv.innerHTML = 'location updated ' + new Date(mapData.lastUpdate).toLocaleString()
    }
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(timeDiv)

    // Create speed block
    if (mapData.settings.showSpeed) {
      const speedSign = document.createElement('div')
      const speedLabel = document.createElement('div')
      const speedText = document.createElement('div')
      const speedUnit = document.createElement('div')
      speedLabel.id = 'spd-label'
      speedLabel.innerHTML = 'SPEED'
      speedText.id = 'spd'
      // Initially hide speed sign if multiple vehicles
      if (mapData.vehicles.length!==1) speedSign.style.display = 'none'
      // Show last speed if single vehicle
      else speedText.innerHTML = (mapData.settings.units === 'standard')?
        (parseFloat(mapData.vehicles[0].last.spd) * 2.23694).toFixed() :
        mapData.vehicles[0].last.spd.toFixed()
      speedUnit.id = 'spd-unit'
      speedUnit.innerHTML = (mapData.settings.units === 'standard') ? 'm.p.h.' : 'k.p.h.'
      speedSign.id = 'spd-sign'
      speedSign.appendChild(speedLabel)
      speedSign.appendChild(speedText)
      speedSign.appendChild(speedUnit)
      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(speedSign)
    }

    // Create altitude block
    if (mapData.settings.showAlt) {
      elevator = new google.maps.ElevationService()
      const altitudeSign = document.createElement('div')
      const altitudeLabel = document.createElement('div')
      const altitudeText = document.createElement('div')
      const altitudeUnit = document.createElement('div')
      altitudeLabel.id = 'alt-label'
      altitudeText.id = 'alt'
      altitudeUnit.id = 'alt-unit'
      altitudeSign.id = 'alt-sign'
      altitudeLabel.innerHTML = 'ALTITUDE'
      // Initially hide altitude sign if multiple vehicles
      if (mapData.vehicles.length!==1) altitudeSign.style.display = 'hide'
      // Show last altitude if single vehicle
      else parseAlt(mapData.vehicles[0].last).then(function (alt) {
        altitudeText.innerHTML = convertMeters(alt)
      }).catch(function (err) {
        console.error('Could not load altitude from last known location: ', err)
        altitudeText.innerHTML = '????'
      })
      altitudeUnit.innerHTML = (mapData.settings.units === 'standard') ? 'feet' : 'meters'
      altitudeSign.appendChild(altitudeLabel)
      altitudeSign.appendChild(altitudeText)
      altitudeSign.appendChild(altitudeUnit)
      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(altitudeSign)
    }

  }

  // Create streetview
  if (disp !== '0' && mapData.settings.showStreetview && mapData.vehicles.length===1)
    updateStreetView(parseLoc(mapData.vehicles[0].last), 10)

  // Get altitudes from Google API
  function getAlt (loc) {
    return new Promise(function (resolve, reject) {
      // Get elevator service
      elevator = elevator || new google.maps.ElevationService()
      // Query API
      return elevator.getElevationForLocations({
        'locations': [{ lat: loc.lat, lng: loc.lon }]
      }, function (results, status, errorMessage) {
          // Success; return altitude
        if (status === google.maps.ElevationStatus.OK && results[0]) {
          console.log('Altitude was retrieved from Google Elevations API as', results[0].elevation, 'm')
          resolve(results[0].elevation)

        // Unable to get any altitude
        } else reject(Error(errorMessage))
      })
    })
  }

  // Parse altitude
  function parseAlt (loc) {
    console.log('parseAlt('+loc+'})')

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
    return {
      spd: (mapData.settings.units === 'standard')?
        parseFloat(loc.spd) * 2.23694:
        parseFloat(loc.spd),
      dir: parseFloat(loc.dir),
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
      //alt: parseAlt(loc), // TODO: Check if this is needed
      tim: new Date(loc.tim).toLocaleString(),
    }
  }

  // Got location
  socket.on('get', function (loc) {
    console.log('Got location:', loc.lat + ', ' + loc.lon+' for '+loc.veh)

    // Parse location
    parsed_loc = parseLoc(loc)

    // Update map
    if (disp !== '1') {
      console.log('Setting vehicle',loc.veh,'to',loc.lat+',',loc.lon+'...')

      // Update time
      $('#timestamp').text('location updated ' + parsed_loc.tim)

      // Update marker
      google.maps.event.trigger(map, 'resize') //TODO: Figure out what this line does
      if (markers[loc.veh])
        markers[loc.veh].setPosition({
          lat: parsed_loc.lat,
          lng: parsed_loc.lon,
        })

      // Set map center
      if (mapData.settings.center.type!=='static')
      if ( (selected_vehicle && loc.veh===selected_vehicle) ||
        (!selected_vehicle && loc.veh===mapData.settings.center.follow) )
        map.setCenter({
          lat: parsed_loc.lat,
          lng: parsed_loc.lon,
        })

      // Update speed
      if (mapData.settings.showSpeed) {
        markers[loc.veh].speed = parsed_loc.spd.toFixed()
        if (mapData.vehicles.length===1 || selected_vehicle===loc.veh)
          $('#spd').text(parsed_loc.spd.toFixed())
      }

      // Update altitude
      if (mapData.settings.showAlt) {
        parseAlt(loc)
        .then(convertMeters)
        .then(function (alt) {
          // Set marker altitude
          markers[loc.veh].altitude = alt
          // Set sign
          if (mapData.vehicles.length===1 || selected_vehicle===loc.veh)
            $('#alt').text(alt)
        }).catch(function (err) {
          markers[loc.veh].altitude = undefined
          if (mapData.vehicles.length===1 || selected_vehicle===loc.veh)
            $('#alt').text('????')
          console.error(err.message)
        })
      }

    }

    // Update street view
    if (disp !== '0' && mapData.settings.showStreetview && mapData.vehicles.length === 1)
      updateStreetView(parsed_loc, 10)

  })

  // Get street view imagery
  function getStreetViewData (loc, rad, cb) {
    // Ensure that the location hasn't changed (or this is the initial setting)
    if (parsed_loc == null || loc.tim === parsed_loc.tim) {
      if (!sv) var sv = new google.maps.StreetViewService()
      sv.getPanorama({
        location: {
          lat: loc.lat,
          lng: loc.lon
        },
        radius: rad
      }, function (data, status) {
        switch (status) {
          // Success
          case google.maps.StreetViewStatus.OK: {
            cb(data)
            break
          // No results in that radius
          } case google.maps.StreetViewStatus.ZERO_RESULTS: {
            // Try again with a bigger radius
            getStreetViewData(loc, rad * 2, cb)
            break
          // Error
          } default:
            console.error(Error('Street view not available: ' + status).message)
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
        '&heading=' + ((loc.spd > 2) ? loc.dir : String(getBearing(loc, data.location))) +
        '&key=' + mapKey
      )
    })

  }

}
