import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { loadChatConversation } from './ui/ui-ai-chat.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

let currentPage = 1; // Define currentPage globally

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html');
        } else {
            console.log('User is logged in. Initializing DB and UI components...');

            // Proceed with initializing UI components
            loadMenu(localDb, 'hello_world_menu');
            loadMainContentControls(localDb, 'hello_world_controls');
            loadTasksRegularly();
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});

let PAGE_SIZE = 5; // Default number of tasks per page

const loadTasks = async () => {
    try {
        const tasksData = await localDb.get('maxwell_ai_tasks');
        renderTasks(tasksData.tasks);
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

const renderTasks = (tasks) => {
    const tasksContainer = document.getElementById('main-content');
    tasksContainer.innerHTML = ''; // Clear existing content

    const paginatedTasks = paginate(tasks, currentPage, PAGE_SIZE);
    const table = createTaskTable(paginatedTasks);
    tasksContainer.appendChild(table);

    renderPagination(tasks.length);
};

const createTaskTable = (tasks) => {
    const table = document.createElement('table');
    table.className = 'table task-table'; // Added class for styling
    table.id = 'task-table'; // Unique ID for the table

    // Create table header
    const headerRow = document.createElement('tr');
    const headers = ['Description', 'AI']; // Table headers
    headers.forEach((headerText, index) => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerCell.setAttribute('title', `Click to sort ${headerText.toLowerCase()} column`);
        headerCell.id = `header-${index + 1}`; // Unique ID for each header cell
        headerRow.appendChild(headerCell);
    });
    const header = document.createElement('thead');
    header.appendChild(headerRow);
    table.appendChild(header);

    // Create table body
    const body = document.createElement('tbody');
    tasks.forEach((task, index) => {
        const row = document.createElement('tr');
        row.className = 'task-row'; // Added class for styling
        row.id = `row-${index + 1}`; // Unique ID for each row

        // Create description cell
        const descriptionCell = document.createElement('td');
        const taskDescription = document.createElement('p');
        taskDescription.textContent = task.description;

        // Create priority badge
        const priorityBadge = document.createElement('span');
        priorityBadge.textContent = task.priority;
        priorityBadge.className = 'badge bg-secondary priority-badge me-1'; // Added class for styling
        priorityBadge.setAttribute('title', 'Priority');

        // Create completion date
        const completionDate = document.createElement('span');
        completionDate.textContent = new Date(task.target_date_and_time_completion).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
        completionDate.className = 'badge bg-primary completion-date-badge'; // Added class for styling

        // Create category badge
        const categoryBadge = document.createElement('span');
        categoryBadge.textContent = task.category;
        categoryBadge.className = 'badge bg-tertiary category-badge'; // Added class for styling

        // Append completion date, priority, and category badges to a container
        const descriptionDetails = document.createElement('div');
        descriptionDetails.appendChild(completionDate);
        descriptionDetails.appendChild(priorityBadge);
        descriptionDetails.appendChild(categoryBadge);

        // Append description and details to description cell
        descriptionCell.appendChild(taskDescription);
        descriptionCell.appendChild(descriptionDetails);

        descriptionCell.setAttribute('title', 'Description');
        descriptionCell.className = 'description-cell'; // Added class for styling
        descriptionCell.id = `description-cell-${index + 1}`; // Unique ID for each description cell
        row.appendChild(descriptionCell);

        // Create AI chat button cell
        const aiChatCell = document.createElement('td');
        const aiChatButton = document.createElement('button');
        aiChatButton.textContent = '';
        aiChatButton.className = 'btn btn-primary ai-chat-button'; // Added class for styling
        aiChatButton.setAttribute('aria-label', 'Initiate AI Chat for this task');
        aiChatButton.setAttribute('title', 'Initiate AI Chat');

        // Pass the necessary task details as arguments to openChatModal
        aiChatButton.addEventListener('click', () => openChatModal(task._id, task.category, task.description));

        aiChatButton.id = `ai-chat-button-${index + 1}`; // Unique ID for each AI chat button cell
        aiChatCell.appendChild(aiChatButton);
        row.appendChild(aiChatCell);

        // Append row to table body
        body.appendChild(row);
    });
    table.appendChild(body);

    return table;
};

const MAX_VISIBLE_PAGES = 5; // Maximum number of visible page buttons

const renderPagination = (totalTasks) => {
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
    } else {
        paginationContainer.innerHTML = ''; // Clear existing pagination
    }
    paginationContainer.id = 'pagination-container'; // Unique ID for the pagination container

    const totalPages = Math.ceil(totalTasks / PAGE_SIZE);

    if (totalPages > 1) {
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Task Pagination');
        nav.id = 'pagination-navigation'; // Unique ID for the pagination navigation

        const ul = document.createElement('ul');
        ul.className = 'pagination pagination-list'; // Added class for styling
        ul.id = 'pagination-list'; // Unique ID for the pagination list

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = 'page-item prev-page-item'; // Added class for styling
        prevLi.id = 'prev-page-item'; // Unique ID for the previous page item
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link prev-page-link'; // Added class for styling
        prevLink.href = '#';
        prevLink.innerHTML = 'Previous';
        prevLink.title = 'Go to Previous Page'; // Tooltip
        prevLink.setAttribute('aria-label', 'Go to Previous Page');
        prevLink.id = 'prev-page-link'; // Unique ID for the previous page link
        prevLink.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadTasks();
            }
        });
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);

        // Page buttons
        const startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
        const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = 'page-item'; // Added class for styling
            li.id = `page-item-${i}`; // Unique ID for each page item
            const link = document.createElement('a');
            link.className = 'page-link page-link-item'; // Added class for styling
            link.href = '#';
            link.innerHTML = i;
            link.title = `Go to Page ${i}`; // Tooltip
            link.addEventListener('click', (event) => {
                currentPage = parseInt(event.target.innerHTML);
                loadTasks();
            });
            li.appendChild(link);
            ul.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = 'page-item next-page-item'; // Added class for styling
        nextLi.id = 'next-page-item'; // Unique ID for the next page item
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link next-page-link'; // Added class for styling
        nextLink.href = '#';
        nextLink.innerHTML = 'Next';
        nextLink.title = 'Go to Next Page'; // Tooltip
        nextLink.setAttribute('aria-label', 'Go to Next Page');
        nextLink.id = 'next-page-link'; // Unique ID for the next page link
        nextLink.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadTasks();
            }
        });
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);

        nav.appendChild(ul);
        paginationContainer.appendChild(nav);
        document.getElementById('main-content').insertAdjacentElement('afterend', paginationContainer);
    }
};

const paginate = (array, currentPage, pageSize) => {
    const startIndex = (currentPage - 1) * pageSize;
    return array.slice(startIndex, startIndex + pageSize);
};

const adjustPageSize = () => {
    if (window.innerWidth < 768) {
        PAGE_SIZE = 3; // Small screens like phones
    } else if (window.innerWidth < 992) {
        PAGE_SIZE = 4; // Medium screens like tablets
    } else {
        PAGE_SIZE = 5; // Large screens like computers
    }

    loadTasks();
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
    loadChatConversation('maxwellai_task_feedback', _id);

    // Open the modal using Bootstrap's JavaScript API.
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show();
};

adjustPageSize();
window.addEventListener('resize', adjustPageSize);
