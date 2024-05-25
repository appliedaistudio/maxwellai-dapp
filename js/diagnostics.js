import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { runNotificationUtilsTestSuite } from './db/data-specific/notification-utils.js';
import { testLLMResponses } from './ai/physarai/physarai-llm-schema.js';
import { runTaskUtilsTestSuite } from './db/data-specific/task-utils.js';
import { runNetworkUtilsTestSuite } from './db/data-specific/network-utils.js';

// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Event listener for when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    isLoggedIn(localDb)
        .then(loggedIn => {
            if (!loggedIn) {
                // Redirect to login page if not logged in
                window.location.replace('./login.html');
            } else {
                // Log status and initialize UI components
                console.log('User is logged in. Initializing DB and UI components...');
                loadMenu(localDb, 'dapp_menu');
                loadMainContentControls(localDb, 'dapp_controls')
            }
        })
        .catch(err => {
            // Log any error during login check
            console.error('Error while checking if user is logged in:', err);
        });
});

// Add an event listener for messages from the service worker to indicate when the AI is thinking
navigator.serviceWorker.addEventListener('message', (event) => {
    const appContent = document.getElementById('app-content');

    if (event.data.action === 'startPulsing') {
        appContent.classList.add('pulsing');
    } else if (event.data.action === 'stopPulsing') {
        appContent.classList.remove('pulsing');
    }
});

// Run the diagnostics
await runNotificationUtilsTestSuite();
testLLMResponses();
await runTaskUtilsTestSuite();
await runNetworkUtilsTestSuite();
