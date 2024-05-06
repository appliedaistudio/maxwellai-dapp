import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { loadChatConversation } from './ui/ui-ai-chat.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html');
        } else {
            console.log('User is logged in. Initializing DB and UI components...');

            // Proceed with initializing UI components
            loadMenu(localDb, 'hello_world_menu');
            loadMainContentControls(localDb, 'hello_world_controls');
            loadNotificationsRegularly();
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});

const loadNotifications = async () => {
    try {
        const notificationsData = await localDb.get('notifications');
        renderNotifications(notificationsData.notifications);
    } catch (err) {
        console.error('Could not fetch notifications from PouchDB:', err);
    }
};

// Define a function to load notifications at regular intervals
const loadNotificationsRegularly = () => {
    loadNotifications(); // Load notifications immediately

    // Set interval to reload notifications every 10 seconds
    setInterval(loadNotifications, 10000); // 10 seconds = 10000 milliseconds
};

const renderNotifications = (notifications) => {
    const notificationsContainer = document.getElementById('main-content');
    notificationsContainer.innerHTML = '';
    notificationsContainer.style.overflowY = 'auto'; // Make the container scrollable
    notificationsContainer.className = 'card-container'; // Use the same style as task cards

    notifications.forEach((notification, index) => {
        const card = document.createElement('div');
        card.className = 'card task-card'; // Reuse task card styles
        card.style.borderRadius = '15px'; // Consistent styling with task cards
        card.title = 'A helpful intervention'; // Tooltip for the entire card

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex';

        // Column for AI chat icon
        const chatColumn = document.createElement('div');
        chatColumn.className = 'chat-column pe-3'; // Padding end (right) for spacing
        const aiChatButton = document.createElement('button');
        aiChatButton.className = 'btn btn-primary ai-chat-button';
        aiChatButton.textContent = '';
        aiChatButton.title = 'Initiate chat about this notification'; // Tooltip for chat button
        aiChatButton.addEventListener('click', () => openChatModal(notification._id, notification.topic, notification.body));
        chatColumn.appendChild(aiChatButton);
        chatColumn.style.alignItems = 'flex-start'; // Align icon to the top

        // Text column for notification content and details
        const textColumn = document.createElement('div');
        textColumn.className = 'text-column ms-3'; // Margin start (left) for spacing

        // Notification message
        const message = document.createElement('p');
        message.className = 'card-text';
        message.textContent = notification.body;
        message.title = 'Notification message'; // Tooltip
        textColumn.appendChild(message);

        // List actions
        const actionsList = document.createElement('p');
        actionsList.textContent = "Actions: ";
        const actionsText = notification.actions.close.map(action => `Close ${action}`).concat(notification.actions.open.map(action => `Open ${action}`)).join(", ");
        actionsList.textContent += actionsText;
        actionsList.title = 'Actions that will be taken by the AI'; // Tooltip
        textColumn.appendChild(actionsList);

        // Notification date
        const dateBadge = document.createElement('span');
        dateBadge.className = 'badge bg-primary date-badge';
        dateBadge.textContent = new Date(notification.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        dateBadge.title = 'Date of notification'; // Tooltip
        textColumn.appendChild(dateBadge);

        // Notification topic
        const topicBadge = document.createElement('span');
        topicBadge.className = 'badge bg-secondary topic-badge';
        topicBadge.textContent = notification.topic;
        topicBadge.title = 'Topic of notification'; // Tooltip
        textColumn.appendChild(topicBadge);

        // Notification status
        const statusBadge = document.createElement('span');
        statusBadge.className = 'badge bg-info status-badge';
        statusBadge.textContent = notification.status;
        statusBadge.title = 'Current status of notification'; // Tooltip
        textColumn.appendChild(statusBadge);

        // Append columns to card body
        cardBody.appendChild(chatColumn);
        cardBody.appendChild(textColumn);
        card.appendChild(cardBody);
        notificationsContainer.appendChild(card); // Append each card to the container
    });
};

const openChatModal = (_id, category, description) => {
    console.log("Opening chat for task:", _id, category, description); // Example usage of the passed parameters

    // Here you can use the _id, category, and description to adjust the modal content or behavior.
    // Let's set these as the modal's title or part of its body content.
    
    const chatModal = document.getElementById('chatModal');
    const modalTitle = chatModal.querySelector('.modal-title');
    const modalBody = chatModal.querySelector('.modal-body');

    // Set modal title and body.
    // Note: This will replace any existing content in the title.
    modalTitle.textContent = `We're talking about ${category}`;
    
    // Load the existing chat conversation
    loadChatConversation('notification_feedback', _id);

    // Open the modal using Bootstrap's JavaScript API.
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show();
};

export {loadNotifications}
