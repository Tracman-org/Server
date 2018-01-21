'use strict'
// https://github.com/GoogleChrome/samples/blob/gh-pages/service-worker/basic/service-worker.js
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// Names of the two caches used in this version of the service worker.
// Change when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-0.8.0'
const RUNTIME = 'runtime'

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  '/',
  '/static/js/.*.bun.js',
  '/static/css/.*.min.css',
  '/static/manifest.json',
]

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(function(cache){ cache.addAll(PRECACHE_URLS) })
      .then(self.skipWaiting())
  )
})

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', function(event) {
  const currentCaches = [PRECACHE, RUNTIME]
  event.waitUntil(
    caches.keys().then( function(cacheNames) {
      return cacheNames.filter( function(cacheName){ !currentCaches.includes(cacheName) })
    }).then( function(cachesToDelete) {
      return Promise.all(cachesToDelete.map( function(cacheToDelete) {
        return caches.delete(cacheToDelete)
      }))
    }).then( function(){ self.clients.claim() )
  )
})

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', function(event) {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then( function(cachedResponse) {
        if (cachedResponse) {
          return cachedResponse
        }

        return caches.open(RUNTIME).then( function(cache) {
          return fetch(event.request).then( function(res) {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, res.clone()).then( function() {
              return res
            })
          })
        })
      })
    )
  }
})