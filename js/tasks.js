// Imports necessary configurations and modules
import config from './dapp-config.js';
import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';
import { loadChatConversation } from './ui/ui-ai-chat.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Check if user is logged in when document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html'); // Redirect to login page if not logged in
        } else {
            console.log('User is logged in. Initializing DB and UI components...');
            loadMenu(localDb, 'hello_world_menu');
            loadMainContentControls(localDb, 'hello_world_controls');
            loadTasks(); // Load tasks after verifying login
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});

// Fetch tasks from PouchDB and handle them
const loadTasks = async () => {
    try {
        const tasksData = await localDb.get('maxwell_ai_tasks');
        renderTasksAsCards(tasksData.tasks); // Render tasks as cards
    } catch (err) {
        console.error('Could not fetch tasks from PouchDB:', err);
    }
};

// Render tasks as cards in the main content area
const renderTasksAsCards = (tasks) => {
    const tasksContainer = document.getElementById('main-content');
    tasksContainer.innerHTML = '';
    tasksContainer.style.overflowY = 'auto'; // Make the container scrollable
    tasksContainer.className = 'card-container'; // Style the container as a card container

    tasks.forEach((task, index) => {
        const card = document.createElement('div');
        card.className = 'card task-card'; // Style the card
        card.style.borderRadius = '15px'; // Set rounded edges for cards
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

        textColumn.appendChild(details);
        
        // Append columns to card body
        cardBody.appendChild(chatColumn);
        cardBody.appendChild(textColumn);
        card.appendChild(cardBody);
        tasksContainer.appendChild(card); // Append each card to the container
    });
};

// Function to open a modal for chatting about a specific task
const openChatModal = (_id, category, description) => {
    console.log("Opening chat for task:", _id, category, description);
    const chatModal = document.getElementById('chatModal');
    const modalTitle = chatModal.querySelector('.modal-title');
    modalTitle.textContent = `Chat about: ${category}`;
    loadChatConversation('maxwellai_task_feedback', _id);
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show(); // Display the modal
};
