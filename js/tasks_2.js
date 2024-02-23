// Begin with the existing imports
import config from './dapp-config.js';
import { initializeUsers } from './db/db-init-users.js';
import { initializeMenu } from './db/db-init-menu.js';
import { initializeMainContent } from './db/db-init-main-content-controls.js';
import { initializeNotifications } from './db/db-init-notifications.js';
import { initializeTasks } from './db/db-init-tasks.js'
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
    initializeTasks(localDb);
};

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
    
    const accordionDiv = document.createElement('div');
    accordionDiv.id = 'tasksAccordion';
    accordionDiv.className = 'accordion';
    
    tasks.forEach((task, index) => {
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

    // After rendering tasks, call for pagination control setup
    setupPaginationContainer();
    updatePagination(); // This will calculate and render pagination based on the current page and items per page
};

const setupPaginationContainer = () => {
    // Assuming main-content is the wrapper where tasks are displayed
    const mainContent = document.getElementById('main-content');
    
    // Create pagination container if it doesn't exist
    let paginationControls = document.getElementById('paginationControls');
    if (!paginationControls) {
        paginationControls = document.createElement('nav');
        paginationControls.setAttribute('aria-label', "Page navigation");
        paginationControls.id = 'paginationControls';
        paginationControls.className = 'mt-4'; // Bootstrap margin class for spacing
        mainContent.appendChild(paginationControls);
    }
};

const renderPaginationControls = () => {
    const paginationContainer = document.getElementById('paginationControls'); // Ensure this exists in HTML

    // Ensure the container exists; if not, call setupPaginationContainer
    if (!paginationContainer) {
        setupPaginationContainer();
    }

    paginationContainer.innerHTML = ''; // Clear existing controls
  
    let paginationHTML = `<ul class="pagination justify-content-center">`; // Centered pagination
  
    // Previous button
    paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                          <a class="page-link" href="#" tabindex="-1" aria-disabled="true" onclick="changePage(${currentPage - 1})">Previous</a>
                       </li>`;
  
    for(let i = 1; i <= totalPages; i++) {
      paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                         </li>`;
    }
  
    // Next button
    paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                          <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
                       </li>`;
  
    paginationHTML += `</ul>`;
    paginationContainer.innerHTML = paginationHTML;
  };
  
  // A simple function to change the page and update the tasks displayed
  const changePage = (pageNum) => {
    currentPage = pageNum;
    updatePagination(); // Make sure to call updatePagination to load the new set of tasks
  };

const debounce = (func, wait) => {
let timeout;
return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
};
};

// Listen for screen resize to adjust items per page
window.addEventListener('resize', debounce(() => {
    updatePagination();
}, 250));

// Ensure the debounce function is defined if not already