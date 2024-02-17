// Begin with the existing imports
import config from './dapp-config.js';
import { initializeUsers } from './db/db-init-users.js';
import { initializeMenu } from './db/db-init-menu.js';
import { initializeMainContent } from './db/db-init-main-content-controls.js';
import { initializeNotifications } from './db/db-init-notifications.js';
import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

let currentPage = 1; // Define currentPage globally

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html');
        } else {
            console.log('User is logged in. Initializing DB and UI components...');
            // Proceed with initializing other parts of the database and UI components
            initializeAllDataBaseParts();
            loadMenu(localDb, 'hello_world_menu');
            loadMainContentControls(localDb, 'hello_world_controls');
            loadTasks();
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});

const initializeAllDataBaseParts = () => {
    initializeUsers(localDb);
    initializeMenu(localDb);
    initializeMainContent(localDb);
    initializeNotifications(localDb);
};

let PAGE_SIZE = 5; // Number of tasks per page

const loadTasks = async () => {
    try {
        const tasksData = await localDb.get('maxwell_ai_tasks');
        renderTasks(tasksData.tasks);
    } catch (err) {
        console.error('Could not fetch tasks from PouchDB:', err);
    }
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
    table.className = 'table';

    // Create table header
    const headerRow = document.createElement('tr');
    const headers = ['Priority', 'Category', 'Description', 'AI Chat']; // Table headers
    headers.forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerRow.appendChild(headerCell);
    });
    const header = document.createElement('thead');
    header.appendChild(headerRow);
    table.appendChild(header);

    // Create table body
    const body = document.createElement('tbody');
    tasks.forEach(task => {
        const row = document.createElement('tr');

        // Create priority icon cell
        const priorityCell = document.createElement('td');
        const priorityIcon = document.createElement('img');
        priorityIcon.src = `priority-${task.priority}.png`; // Assuming priority images are named as priority-<priority>.png
        priorityIcon.alt = `Priority: ${task.priority}`;
        priorityIcon.setAttribute('aria-label', `Priority: ${task.priority}`);
        priorityIcon.className = 'priority-icon';
        priorityCell.appendChild(priorityIcon);
        row.appendChild(priorityCell);

        // Create category cell
        const categoryCell = document.createElement('td');
        const categoryTitle = document.createElement('h5');
        categoryTitle.textContent = task.category;
        categoryCell.appendChild(categoryTitle);
        row.appendChild(categoryCell);

        // Create description cell
        const descriptionCell = document.createElement('td');
        const taskDescription = document.createElement('p');
        taskDescription.textContent = task.description;
        descriptionCell.appendChild(taskDescription);
        row.appendChild(descriptionCell);

        // Create AI chat button cell
        const aiChatCell = document.createElement('td');
        const aiChatButton = document.createElement('button');
        aiChatButton.textContent = 'AI Chat';
        aiChatButton.className = 'btn btn-primary';
        aiChatButton.setAttribute('aria-label', 'Initiate AI Chat for this task');
        aiChatCell.appendChild(aiChatButton);
        row.appendChild(aiChatCell);

        // Append row to table body
        body.appendChild(row);
    });
    table.appendChild(body);

    return table;
};

const renderPagination = (totalTasks) => {
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
    } else {
        paginationContainer.innerHTML = ''; // Clear existing pagination
    }

    const totalPages = Math.ceil(totalTasks / PAGE_SIZE);

    if (totalPages > 1) {
        const ul = document.createElement('ul');
        ul.className = 'pagination';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = 'page-item';
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.innerHTML = 'Previous';
        prevLink.setAttribute('aria-label', 'Go to Previous Page');
        prevLink.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadTasks();
            }
        });
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);

        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = 'page-item';
            const link = document.createElement('a');
            link.className = 'page-link';
            link.href = '#';
            link.innerHTML = i;
            link.setAttribute('aria-label', `Go to Page ${i}`);
            link.addEventListener('click', (event) => {
                currentPage = parseInt(event.target.innerHTML);
                loadTasks();
            });
            li.appendChild(link);
            ul.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = 'page-item';
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.innerHTML = 'Next';
        nextLink.setAttribute('aria-label', 'Go to Next Page');
        nextLink.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadTasks();
            }
        });
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);

        paginationContainer.appendChild(ul);
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
        PAGE_SIZE = 5; // Medium screens like tablets
    } else {
        PAGE_SIZE = 6; // Large screens like computers
    }

    loadTasks();
};

adjustPageSize();
window.addEventListener('resize', adjustPageSize);
