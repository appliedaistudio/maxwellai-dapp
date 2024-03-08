import config from '../dapp-config.js';

import { initializeUsers } from './db-init-users.js';
import { initializeMenu } from './db-init-menu.js';
import { initializeMainContent } from './db-init-main-content-controls.js'
import { initializeNotifications } from './db-init-notifications.js'
import { initializeTasks } from './db-init-tasks.js';
import { initializeFeed } from './db-init-feed.js';
import { initializeFeedFeedback } from './db-init-feed-feedback.js';
import { initializeTaskFeedback } from './db-init-task-feedback.js';
import { initializeProjectFeedback } from './db-init-project-feedback.js';
import { initializeNotificationFeedback } from './db-init-notification-feedback.js';

// Construct the full remote database URL with credentials for authentication
const remoteDbUrl = `https://${encodeURIComponent(config.remoteDbUsername)}:${encodeURIComponent(config.remoteDbPassword)}@${config.remoteDbBase}`;


// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Initialize each part of the database
initializeUsers(localDb);
initializeMenu(localDb);
initializeMainContent(localDb);
initializeNotifications(localDb);
initializeTasks(localDb);
initializeFeed(localDb);
initializeFeedFeedback(localDb);
initializeTaskFeedback(localDb);
initializeProjectFeedback(localDb);
initializeNotificationFeedback(localDb);
