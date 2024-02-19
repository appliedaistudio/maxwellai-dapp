import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';


// Construct the full remote database URL with credentials for authentication
const remoteDbUrl = `https://${encodeURIComponent(config.remoteDbUsername)}:${encodeURIComponent(config.remoteDbPassword)}@${config.remoteDbBase}`;


// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Sync function with authentication
function syncDatabases() {
    // Perform a two-way, continuous replication with credential as part of the URL
    PouchDB.sync(localDb, remoteDbUrl, {
        live: true,
        retry: true,
        // Optionally, add other sync options if needed
    })
    .on('change', info => {
        console.log('Database sync: change detected', info);
    })
    .on('paused', info => {
        console.log('Database sync paused', info);
    })
    .on('active', info => {
        console.log('Database sync resumed', info);
    })
    .on('denied', err => {
        console.error('Database sync denied access', err);
    })
    .on('complete', info => {
        console.log('Database sync complete', info);
    })
    .on('error', err => {
        console.error('Database sync error', err);
    });
}

// Call the sync function to start the process when the app starts
//syncDatabases();

// Load a stored conversation into the chat window
async function loadChatConversation(data_name, nodeName, conversationId) {
    
    // Fetch the data from PouchDB
    const data = await localDb.get(data_name);

    const chatWindow = document.getElementById('chat-body');
    chatWindow.innerHTML = '';  // Clear existing messages

    try {
        // Find the conversation corresponding to the given ID
        const conversation = data[nodeName].find(item => item._id === conversationId);
        
        if (!conversation) {
            console.error('Conversation not found.');
            return;
        }

        // Iterate over dialogue and format the messages
        conversation.dialogue.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = `${message.speaker}: ${message.text}`;
            
            // Apply different classes based on the speaker for styling
            messageDiv.className = message.speaker === 'AI' ? 'ai-message' : 'user-message';

            // Add tooltip for each message
            messageDiv.title = message.text;

            chatWindow.appendChild(messageDiv);
            chatWindow.appendChild(document.createElement('br')); // Add line break after each message
        });

        // Show the modal if not already visible
        // Implementation depends on how your modal is being handled
        $('#chatModal').modal('show'); // Example for Bootstrap-based modal
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

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