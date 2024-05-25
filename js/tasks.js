import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { loadChatConversation } from './ui/ui-ai-chat.js';

import { log } from './utils/logging.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html');
        } else {
            console.log('User is logged in. Initializing DB and UI components...');

            // Proceed with initializing UI components
            loadMenu(localDb, 'dapp_menu');
            loadMainContentControls(localDb, 'dapp_controls');
            loadTasksRegularly();
        }
    }).catch(err => {
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

// Fetch tasks from PouchDB and handle them
const loadTasks = async () => {
    try {
        const tasksData = await localDb.get('tasks');
        renderTasksAsCards(tasksData.tasks); // Render tasks as cards
    } catch (err) {
        console.error('Could not fetch tasks from PouchDB:', err);
    }
};

// Define a function to load tasks at regular intervals
const loadTasksRegularly = () => {
    loadTasks(); // Load tasks immediately

    // Set interval to reload tasks every 15 seconds
    setInterval(loadTasks, 10000); // 10 seconds = 10000 milliseconds
};

// Render tasks as cards in the main content area
const renderTasksAsCards = (tasks) => {
    const tasksContainer = document.getElementById('main-content');
    tasksContainer.innerHTML = '';
    tasksContainer.style.overflowY = 'auto'; // Make the container scrollable
    tasksContainer.className = 'card-container'; // Style the container as a card container

    tasks.forEach((task, index) => {
        const card = document.createElement('div');
        card.className = 'card'; // Style the card
        card.title = 'A small, meaningful task'; // Tooltip for the entire card

        // Create a flex container to hold columns
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex';

        // Column for AI chat icon
        const chatColumn = document.createElement('div');
        chatColumn.className = 'chat-column';
        const aiChatButton = document.createElement('button');
        aiChatButton.className = 'btn btn-primary ai-chat-button';
        aiChatButton.textContent = '';
        aiChatButton.title = 'Initiate chat about this task'; // Tooltip for chat button
        aiChatButton.addEventListener('click', () => openChatModal(task._id, task.category, task.description));
        chatColumn.appendChild(aiChatButton);
        chatColumn.style.alignItems = 'flex-start'; // Align icon to the top

        // Column for description and details
        const textColumn = document.createElement('div');
        textColumn.className = 'text-column ms-3'; // Margin start (left) for spacing

        // Description of task
        const description = document.createElement('p');
        description.className = 'card-text';
        description.textContent = task.description;
        description.title = 'Description of the task'; // Tooltip for description
        textColumn.appendChild(description);

        // Shaded information region for badges
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';

        // Display task details like priority, completion date, and category
        const details = document.createElement('div');
        details.className = 'details';

        const priorityBadge = document.createElement('span');
        priorityBadge.className = 'badge bg-secondary priority-badge me-1';
        priorityBadge.textContent = task.priority;
        priorityBadge.title = 'Priority of the task'; // Tooltip for priority
        details.appendChild(priorityBadge);

        const completionDate = document.createElement('span');
        completionDate.className = 'badge bg-primary completion-date-badge';
        completionDate.textContent = new Date(task.target_date_and_time_completion).toLocaleDateString('en-US');
        completionDate.title = 'Target completion date'; // Tooltip for completion date
        details.appendChild(completionDate);

        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'badge bg-info category-badge';
        categoryBadge.textContent = task.category;
        categoryBadge.title = 'Category of the task'; // Tooltip for category
        details.appendChild(categoryBadge);

        cardFooter.appendChild(details);
        textColumn.appendChild(cardFooter);
        
        // Append columns to card body
        cardBody.appendChild(chatColumn);
        cardBody.appendChild(textColumn);
        card.appendChild(cardBody);
        tasksContainer.appendChild(card); // Append each card to the container
    });
};

const openChatModal = (_id, category, description) => {
    const functionName = "openChatModal";
    const msg = "Opening chat for task:" + _id + category + description;
    log(msg, config.verbosityLevel, 4, functionName);

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
    loadChatConversation('task_feedback', _id);

    // Open the modal using Bootstrap's JavaScript API.
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show();
};
