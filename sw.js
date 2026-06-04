const CACHE = 'tc-bss-v15'
const PRECACHE = [
  './index.html', './dashboard.html', './tournament.html',
  './checkin.html', './stats.html', './display.html',
  './anleitung.html', './datenschutz.html', './impressum.html',
  './profile.html', './booking.html',
  './dashboard.js', './config.js', './logo.png',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
