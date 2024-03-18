import './lib/pouchdb/pouchdb.min.js';
import config from './js/dapp-config.js';

const CACHE_NAME = 'cache-v1';
const urlsToCache = [
    './index.html',
    './css/base/base.css',
    './js/dapp.js'
];

let timeIntervalBetweenServiceWorkerRunsInSeconds = 10; // Default time interval between runs of the service worker

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);


// Fetches action and insight takeaways from PouchDB using provided document IDs.
async function takeaways() {
  // List of document IDs
  const documentIds = ["maxwellai_task_feedback", "maxwellai_project_feedback", "maxwellai_feed_feedback", "notification_feedback"];

  // Initialize lists to store action and insight takeaways
  const actionTakeaways = [];
  const insightTakeaways = [];

  // Iterate over each document ID
  for (const docId of documentIds) {
    try {
      // Fetch document from local PouchDB
      const doc = await localDb.get(docId);

      // Iterate over feedback entries in the document
      for (const feedbackEntry of doc.feedback) {
        // Extract takeaway
        const takeaway = feedbackEntry.takeaway;

        // Check if the takeaway is an action and add it to actionTakeaways
        if (takeaway && takeaway.action) {
          actionTakeaways.push(takeaway.action);
        }

        // Check if the takeaway is an insight and add it to insightTakeaways
        if (takeaway && takeaway.insight) {
          insightTakeaways.push(takeaway.insight);
        }
      }
    } catch (error) {
      console.error(`Error fetching document with ID ${docId}: ${error}`);
    }
  }

  // Return the lists of action and insight takeaways
  return [actionTakeaways, insightTakeaways];
}


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
});

async function sendNotifications() {
    try {
      // Fetch the document 'notifications' including the current _rev value
      const response = await localDb.get('notifications');
      // Extracting the first pending notification
      const notification = response.notifications.find(n => n.status === "pending");
      if (notification) {
          // Show the pending notification
          self.registration.showNotification("Title of Notification", {
            body: notification.body
            // Other options like `vibrate`, `badge`, `image`, etc., can also be specified
          });
          // Update the pending notification status as 'sent'
          notification.status = "sent";
          try {
              // Attempt to update the document with the new status
              await localDb.put(response);
          } catch (updateError) {
              // If there's a conflict error, fetch the latest document and retry the update
              if (updateError.name === 'conflict') {
                  const latestResponse = await localDb.get('notifications');
                  // Use the _rev value from the latest fetched document
                  response._rev = latestResponse._rev;
                  await localDb.put(response);
              } else {
                  throw updateError; // For any other errors, rethrow them
              }
          }
      }
  } catch (err) {
      console.error('Error fetching or updating notification from PouchDB:', err);
  }
}

async function actOnExistingTakeaways() {
  try {
    const [actionTakeaways, insightTakeaways] = await takeaways();

    console.log("Action Takeaways:");
    actionTakeaways.forEach(action => console.log(action));

    console.log("\nInsight Takeaways:");
    insightTakeaways.forEach(insight => console.log(insight));
  } catch (error) {
    console.error("Error in takeaways function:", error);
  }
}

async function serviceWorkerLoop(delayInSeconds) {
  // Convert delayInSeconds to milliseconds
  const delayInMilliseconds = delayInSeconds * 1000;

  // Define an iteration of the service worker
  async function serviceWorkerIteration() {
    // Send out any outstanding notifications
    sendNotifications();

    // Take actions on existing takeaways
    await actOnExistingTakeaways();

    setTimeout(serviceWorkerIteration, delayInMilliseconds); // Schedule the next iteration after the specified delay
  }

  // Run an iteration of the service worker execution
  await serviceWorkerIteration();
}

// Run the service worker with a delay in between worker runs
serviceWorkerLoop(timeIntervalBetweenServiceWorkerRunsInSeconds);
