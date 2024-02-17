import config from '../dapp-config.js';

import { initializeUsers } from './db-init-users.js';
import { initializeMenu } from './db-init-menu.js';
import { initializeMainContent } from './db-init-main-content-controls.js'
import { initializeNotifications } from './db-init-notifications.js'
import { initializeTasks } from './db-init-tasks.js';
import { initializeFeed } from './db-init-feed.js';

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
