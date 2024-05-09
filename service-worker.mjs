import './lib/pouchdb/pouchdb.min.js';
import config from './js/dapp-config.js';

// Functions needed for logging
import { log } from './js/utils/logging.js';

// Functions needed to interact with the AI
import { updateNotificationsPrompt, notificationTools } from './js/db/data-specific/notification-utils.js';
import { updateTasksPrompt, taskTools } from './js/db/data-specific/task-utils.js';
import { updateNetworkPrompt, networkTools } from './js/db/data-specific/network-utils.js';
import { commonTools } from './js/utils/common.js';
import { PhysarAI } from './js/ai/physarai.js';

const CACHE_NAME = 'cache-v1';
const urlsToCache = [
    './index.html',
    './css/base/base.css',
    './js/dapp.js'
];

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);


// Fetches action and insight takeaways from PouchDB using provided document IDs.
async function takeaways() {
  const functionName = "takeaways";

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
      log(`Error fetching document with ID ${docId}: ${error}`, config.verbosityLevel, 3, functionName);
    }
  }

  // Return the lists of insight and action takeaways
  return [insightTakeaways, actionTakeaways];
}


// Install event handler
self.addEventListener('install', event => {
  const functionName = "Service Worker Install Event";
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        log('Caching app shell', config.verbosityLevel, 3, functionName);
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event handler
self.addEventListener('activate', event => {
  const functionName = "Service Worker Activate Event";
  clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', event => {
  const functionName = `Service Worker Fetch event for ${event.request.url}`;
  log(`Fetch event for ${event.request.url}`, config.verbosityLevel, 3, functionName);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          log(`Found ${event.request.url} in cache`, config.verbosityLevel, 3, functionName);
          return response;
        }
        log(`Network request for ${event.request.url}`, config.verbosityLevel, 3, functionName);
        return fetch(event.request);
      })
  );
});

// Message event handler to handle all incoming messages in a consolidated manner
self.addEventListener('message', (event) => {
  const functionName = `Service Worker Message event ${event.request}`;
  log('Caching app shell ' + event.data, config.verbosityLevel, 3, functionName);

  // Check if the received message is to engage AI
  if (event.data && event.data.action === 'engageAI') {
    // Call a function to engage AI
    engageAI();
  }

});

async function sendNotifications() {
  const functionName = "sendNotifications"
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
      log('Error fetching or updating notification from PouchDB: ' + err, config.verbosityLevel, 3, functionName);
  }
}

// Define the required output schema for the PhysarAI call
const outputSchema = {
  "$schema": "http://json-schema.org/draft-07/schema",
  "type": "object",
  "properties": {
      "success": {
          "type": "boolean"
      },
      "outputValue": {
          "type": "integer"
      },
      "errorMessage": {
          "type": "string"
      }
  },
  "required": ["outputValue", "success"]
};

// Updates the notifications based on insights gained from user interactions
async function updateNotifications(insightTakeaways) {
  // Create tools for PhysarAI to use
  const physarAiTools = [...notificationTools, ...commonTools];

  // Prompt PhysarAI to update the notifications
  const outcome = await PhysarAI(physarAiTools, insightTakeaways, updateNotificationsPrompt, outputSchema);
}

// Updates the tasks based on insights gained from user interactions
async function updateTasks(insightTakeaways) {
  // Create tools for PhysarAI to use
  const physarAiTools = [...taskTools, ...commonTools];

  // Prompt PhysarAI to update the tasks
  const outcome = await PhysarAI(physarAiTools, insightTakeaways, updateTasksPrompt, outputSchema);
}

// Updates the external resources feed based on insights gained from user interactions
async function updateNetwork(insightTakeaways) {
  // Create tools for PhysarAI to use
  const physarAiTools = [...networkTools, ...commonTools];

  // Prompt PhysarAI to update the external resources feed
  const outcome = await PhysarAI(physarAiTools, insightTakeaways, updateNetworkPrompt, outputSchema);
}

async function engageAI() {
   // Send out any outstanding notifications
   await sendNotifications();

   // Gather insights action items as a result of user interaction
   const [insightTakeaways, actionTakeaways] = await takeaways();

   // Update the notifications based on insights gained from user interactions
   await updateNotifications(insightTakeaways);

   // Update the tasks based on insights gained from user interactions
   //await updateTasks(insightTakeaways);

   // Update the external resources feed based on insights gained from user interactions
   //await updateNetwork(insightTakeaways);

   // Act on the existing action takeaways
   //actionTakeaways.forEach(action => console.log(action));
}

// Code executed by regular AI engagement
function regularAIEngagement() {
  engageAI();
}

// Code executed by realtime AI engagement
function realtimeAIEngagement() {
  //console.log("Engaging AI in realtime...");
}

const regularIntervalInMinutes = 3; // Regular interval in minutes
const regularIntervalInSeconds = regularIntervalInMinutes * 60; // Regular interval in seconds
const regularIntervaInMilliseconds = regularIntervalInSeconds * 1000; // Convert regular interval to milliseconds

// Engage the AI on a regular basis
setInterval(regularAIEngagement, regularIntervaInMilliseconds);

const realtimeInSeconds = 10; // Realtime interval in seconds
const realtimeInMilliseconds = realtimeInSeconds * 1000; // Convert realtime interval to milliseconds

// Engage the AI on a realtime basis
setInterval(realtimeAIEngagement, realtimeInMilliseconds);
