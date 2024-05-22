import config from '../dapp-config.js';

import { initializeDappSettings } from './db-init-dapp-settings.js';
import { initializeUsers } from './db-init-users.js';
import { initializeMenu } from './db-init-menu.js';
import { initializeMainContent } from './db-init-main-content-controls.js'
import { initializeNotifications } from './db-init-notifications.js'
import { initializeTasks } from './db-init-tasks.js';
import { initializeNetwork } from './db-init-nerwork.js';
import { initializeNetworkFeedback } from './db-init-network-feedback.js';
import { initializeTaskFeedback } from './db-init-task-feedback.js';
import { initializeGeneralFeedback } from './db-init-general-feedback.js';
import { initializeNotificationFeedback } from './db-init-notification-feedback.js';

// Construct the full remote database URL with credentials for authentication
const remoteDbUrl = `https://${encodeURIComponent(config.remoteDbUsername)}:${encodeURIComponent(config.remoteDbPassword)}@${config.remoteDbBase}`;


// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Update the session document to mark the database as loaded.
function markDbAsLoadedInTheSession() {
    const sessionId = config.applicationSessionId;
    
    // First, fetch the current session document, or create one if it doesn't exist
    return localDb.get(sessionId).catch(err => {
        if (err.status === 404) {
            // No current session document exists, create a new one
            return {_id: sessionId};
        } else {
            // Some other error occurred, rethrow it
            throw err;
        }
    }).then(sessionDoc => {
        // Set the dbLoaded of the current session to true
        sessionDoc.dbLoaded = true;
        
        // Save the updated session document back to PouchDB
        return localDb.put(sessionDoc);
    });
}

// Load the local PouchDB database and mark it as loaded in the session.
function loadLocalDb() {
    // Initialize each part of the database
    initializeDappSettings(localDb);
    initializeUsers(localDb);
    initializeMenu(localDb);
    initializeMainContent(localDb);
    initializeNotifications(localDb);
    initializeTasks(localDb);
    initializeNetwork(localDb);
    initializeNetworkFeedback(localDb);
    initializeTaskFeedback(localDb);
    initializeGeneralFeedback(localDb);
    initializeNotificationFeedback(localDb);

    console.log("initialized local db");
}

// Initialize the local and remote PouchDB instances and mark the database as loaded in the session.
function initializeDb() {
    const sessionId = config.applicationSessionId;

    // Check if the session document exists
    localDb.get(sessionId).then(sessionDoc => {
        // If the session document exists
        if (!sessionDoc.dbLoaded) {
            // If the database is not loaded, load it and mark it as loaded in the session
            loadLocalDb();
            markDbAsLoadedInTheSession();
        } else {
            // If the database is already loaded, do nothing
        }
    }).catch(err => {
        if (err.status === 404) {
            // No current session document exists, create a new one
            const newSessionDoc = {
                _id: sessionId,
                dbLoaded: false // Set dbLoaded to false initially
            };
            // Save the new session document
            localDb.put(newSessionDoc).then(() => {
                // After saving the session document, load the database and mark it as loaded in the session
                loadLocalDb();
                markDbAsLoadedInTheSession();
            }).catch(err => {
                console.error("Error saving new session document:", err);
            });
        } else {
            // Some other error occurred, handle it accordingly
            console.error("Error checking session document:", err);
        }
    });
}

initializeDb();
