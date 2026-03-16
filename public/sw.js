self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// self.addEventListener('fetch', () => {
//     // A minimum empty fetch handler is required for an automatic PWA banner in some browsers.
//     // Removed to avoid the console warning and improve navigation performance.
// });
