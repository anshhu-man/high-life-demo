/* API responses, photos and account data are never cached by this worker. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
 self.clients.claim(),
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('high-life')).map(k=>caches.delete(k))))
])));
// Deliberately no fetch handler: authenticated content must always reach the server.
