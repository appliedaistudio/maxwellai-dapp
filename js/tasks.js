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

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html');
        } else {
            console.log('User is logged in. Initializing DB and UI components...');
            // Proceed with initializing other parts of the database
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
    // Initializing different parts of the database as per provided initialization functions
    initializeUsers(localDb);
    initializeMenu(localDb);
    initializeMainContent(localDb);
    initializeNotifications(localDb);
};

const PAGE_SIZE = 5; // Number of tasks per page
let currentPage = 1;

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

    const accordionDiv = document.createElement('div');
    accordionDiv.id = 'tasksAccordion';
    accordionDiv.className = 'accordion';

    paginatedTasks.forEach((task, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        const cardHeaderDiv = document.createElement('div');
        cardHeaderDiv.className = 'card-header';
        cardHeaderDiv.id = `heading-${index}`;

        const headerLink = document.createElement('button');
        headerLink.className = 'btn btn-link btn-block text-left';
        headerLink.setAttribute('data-toggle', 'collapse');
        headerLink.setAttribute('data-target', `#collapse-${index}`);
        headerLink.setAttribute('aria-expanded', 'true');
        headerLink.setAttribute('aria-controls', `collapse-${index}`);
        headerLink.innerHTML = `${task.category}: ${task.description} <span class="badge badge-secondary">${task.priority}</span>`;

        cardHeaderDiv.appendChild(headerLink);

        const collapseDiv = document.createElement('div');
        collapseDiv.id = `collapse-${index}`;
        collapseDiv.className = 'collapse';
        collapseDiv.setAttribute('aria-labelledby', `heading-${index}`);
        collapseDiv.setAttribute('data-parent', '#tasksAccordion');

        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.className = 'card-body';
        cardBodyDiv.innerHTML = `
            <p>Status: ${task.status}</p>
            <p>Start: ${task.date_and_time_start}</p>
            <p>Completion Target: ${task.target_date_and_time_completion}</p>
        `;

        collapseDiv.appendChild(cardBodyDiv);
        cardDiv.appendChild(cardHeaderDiv);
        cardDiv.appendChild(collapseDiv);
        accordionDiv.appendChild(cardDiv);
    });

    tasksContainer.appendChild(accordionDiv);

    renderPagination(tasks.length);
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
