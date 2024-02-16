const CACHE_NAME = 'cache-v1';
const urlsToCache = [
    './index.html',
    './css/base/base.css',
    './js/dapp.js'
];

let timeInterval = 10000; // Default time interval set to 10 seconds
let notificationTimer = null; // Reference for the notification timer
let latestNotificationBody = "Default notification message."; // Globally stores the latest notification body

// Install event handler
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event handler
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  clients.claim();
  startTimer(); // Start the timer when the service worker is activated
});

// Fetch event handler
self.addEventListener('fetch', event => {
  console.log(`[Service Worker] Fetch event for ${event.request.url}`);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log(`[Service Worker] Found ${event.request.url} in cache`);
          return response;
        }
        console.log(`[Service Worker] Network request for ${event.request.url}`);
        return fetch(event.request);
      })
  );
});

// Message event handler to handle all incoming messages in a consolidated manner
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Received message:', event.data);

  if (event.data.type === 'SET_INTERVAL') {
    timeInterval = event.data.interval;
    console.log('[Service Worker] Time Interval has been set to:', timeInterval);
    startTimer(); // Restart the timer with the new interval
  } else if (event.data.type === 'NOTIFICATION_BODY_RESPONSE') {
    // Save the notification body received from the main thread
    latestNotificationBody = event.data.body || "Default notification message.";
  }
});

// Adjusting startTimer to request the latest notification body from the main thread before sending notification
function startTimer() {
  console.log('[Service Worker] Starting timer');
  requestNotificationBodyAndSend();
}

function requestNotificationBodyAndSend() {
  // Ask the main thread for the latest notification body message
  self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients && clients.length) {
          // Assuming you want to request the body from just one client
          clients[0].postMessage({ type: 'REQUEST_NOTIFICATION_BODY' });
      }
  });
}

// Reset the timer for the next notification after sending one
function resetTimer() {
  if (notificationTimer) {
      clearTimeout(notificationTimer);
  }
  notificationTimer = setTimeout(requestNotificationBodyAndSend, timeInterval);
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'NOTIFICATION_BODY_RESPONSE') {
      const notificationBody = event.data.body || "No new notifications.";
      self.registration.showNotification("New Notification", { body: notificationBody })
          .then(() => console.log('[Service Worker] Notification displayed'))
          .catch(err => console.error('[Service Worker] Error displaying notification:', err));
      
      // Reset the timer for the next notification
      resetTimer();
  }
  // Handling other types like SET_INTERVAL remains the same
});

startTimer(); // Start the timer initially