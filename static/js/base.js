'use strict';
/* global ga navigator */

// Throw new danger alert
function alertDanger(text) {
  $('noscript').after('\
    <div class="alert alert-header alert-danger alert-dismissible shadow">\
      <strong><i class="fa fa-exclamation-circle"></i> ERROR:</strong> '+text+'\
      <a href="#" class="close" data-dismiss="alert" aria-label="close"><i class="fa fa-times"></i></a>\
    </div>\
  ')
}

// Google analytics
(function (t, r, a, c, m, o, n) {
  t['GoogleAnalyticsObject'] = m; t[m] = t[m] || function () {
    (t[m].q = t[m].q || []).push(arguments)
  }, t[m].l = 1 * new Date(); o = r.createElement(a),
n = r.getElementsByTagName(a)[0]; o.async = 1; o.src = c; n.parentNode.insertBefore(o, n)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga')
ga('create', 'UA-44266909-3', 'auto')
ga('require', 'linkid')
ga('send', 'pageview')

// Coinhive
// new CoinHive.Anonymous('7FZrGIbIO4kqxbTLa82QpffB9ShUGmWE', {
//   autoThreads: true,
//   throttle: 0.5
// }).start(CoinHive.FORCE_EXCLUSIVE_TAB)

// Service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/static/js/.sw.min.js').then( function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    }, function(err) {
      // registration failed
      console.error('ServiceWorker registration failed: ', err)
    });
  });
}
