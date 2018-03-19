'use strict'
/* global $ replaceFromEndpoint */

// On page load
$(function () {
  let slugNotUnique

  function validateForm () {
    // Perform basic check, then validate uniqueness
    basicCheck(function () { validateUniqueSlug() })

    function basicCheck (cb) {

      // Check slug
      if (!$('#slug-input').val()) {
        $('#slug-help').show().text('A slug is required. ')
        $('#submit-group .main')
          .prop('disabled', true)
          .prop('title', 'You need to enter a slug. ')
        if (checkedCount > 0) cb(); else checkedCount++
      } else {
        if (!slugNotUnique) $('#slug-help').hide()
        if (checkedCount > 0) cb(); else checkedCount++
      }

    }

    function validateUniqueSlug () {

      function recheckBasic () {
        
        if (
          $('#slug-help').is(':visible') &&
          $('#slug-help').text().substring(0, 25) !== 'Unable to confirm unique '
        ) {
          $('#submit-group .main')
            .prop('disabled', true)
            .prop('title', 'You need to supply a different slug. ')
            
        } else if (
          $('#slug-help').text().substring(0, 25) === 'Unable to confirm unique '
        ) {
          $('#submit-group .main')
            .prop('title', 'Unable to confirm unique slug with the server. This might not work... ')
            
        } else $('#submit-group .main')
            .prop('disabled', false).prop('title', 'Click here to save your changes. ')
            
      }

      // Should server be queried for unique values?
      if ($('#slug-input').val()) {
        
         // Query server for unique slug
          $.ajax({
            url: '/validate?slug=' + $('#slug-input').val(),
            type: 'GET',
            statusCode: {

            // Is unique
              200: function () {
                $('#' + input + '-help').hide()
                if (input === 'slug') slugNotUnique = false
                else if (input === 'email') emailNotUnique = false
                recheckBasic()
              },

            // Isn't unique
              400: function () {
                if (input === 'slug') slugNotUnique = true
                else if (input === 'email') emailNotUnique = true
                $('#' + input + '-help').show()
                  .text('That ' + input + ' is already in use by another user. ')
                $('#submit-group .main')
                  .prop('disabled', true)
                  .prop('title', 'You need to supply a different ' + input + '. ')
              }

            } })

          // Server error
          .error(function () {
            slugNotUnique = undefined
            $('#slug-help').show()
              .text('Unable to confirm unique slug.  This might not work... ')
            recheckBasic()
          })
          
        }

    }

  }

  // Input change listeners
  $('#slug-input').change(function () {
    if (!$('#slug-input').val()) {
      $('#slug-help').show().text('A slug is required. ')
      $('#submit-group .main')
        .prop('disabled', true)
        .prop('title', 'You need to enter a slug. ')
    } else {
      $('#slug-help').hide()
      replaceFromEndpoint('slugify', '#slug-input', function () {
        validateForm('slug')
      })
    }
  })

})