import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { runNotificationUtilsTestSuite } from './db/data-specific/notification-utils.js';
import { testLLMResponses } from './ai/physarai/physarai-llm-schema.js';

// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Run the notifications utility diagnostics
await runNotificationUtilsTestSuite();

// Run a diagnostic on validating LLM responses
testLLMResponses();

// Listener for app startup logic
document.addEventListener('DOMContentLoaded', () => {
    // Check users' logged-in status
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            sessionStorage.setItem('lastVisitedPage', window.location.href);
            window.location.replace('./login.html');
        } else {
            console.log('A user is currently logged in.');
            loadMenu(localDb, 'hello_world_menu');
            loadMainContentControls(localDb, 'hello_world_controls');
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});
