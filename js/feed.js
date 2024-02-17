import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

let currentPage = 1; // Define currentPage globally
let itemsPerPage = 4; // Default number of items per page

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html');
        } else {
            console.log('User is logged in. Initializing DB and UI components...');
            loadMenu(localDb, 'hello_world_menu');
            loadMainContentControls(localDb, 'hello_world_controls');
            displayFeedData(currentPage, itemsPerPage);
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});

const displayFeedData = async (page, pageSize) => {
    try {
        const feedData = await localDb.get('maxwell_ai_feed');
        renderFeedItems(feedData.urls_to_browse, page, pageSize);
    } catch (err) {
        console.error('Error loading feed data:', err);
    }
};

const renderFeedItems = (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear existing content

    const rowDiv = document.createElement('div');
    rowDiv.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';

    paginatedItems.forEach(item => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col';
        colDiv.innerHTML = `
            <div class="card h-100">
                <img src="${item.thumbnail_url}" class="card-img-top" alt="${item.category}">
                <div class="card-body">
                    <h5 class="card-title">${item.category}</h5>
                    <p class="card-text">${item.description}</p>
                </div>
                <div class="card-footer">
                    <small class="text-muted">${item.usefulness_description}</small>
                </div>
                <a href="${item.url}" class="stretched-link"></a>
            </div>
        `;
        rowDiv.appendChild(colDiv);
    });

    mainContent.appendChild(rowDiv);

    renderPagination(items.length, page, pageSize);
};

const renderPagination = (totalItems, currentPage, pageSize) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
    } else {
        paginationContainer.innerHTML = ''; // Clear existing pagination
    }

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Page navigation');
    const ul = document.createElement('ul');
    ul.className = 'pagination';

    const prevLi = document.createElement('li');
    prevLi.className = 'page-item';
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Previous';
    prevLink.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayFeedData(currentPage, pageSize);
        }
    });
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = 'page-item';
        const link = document.createElement('a');
        link.className = 'page-link';
        link.href = '#';
        link.textContent = i;
        link.addEventListener('click', (event) => {
            currentPage = parseInt(event.target.textContent);
            displayFeedData(currentPage, pageSize);
        });
        li.appendChild(link);
        ul.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = 'page-item';
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Next';
    nextLink.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayFeedData(currentPage, pageSize);
        }
    });
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    nav.appendChild(ul);
    paginationContainer.appendChild(nav);

    const mainContent = document.getElementById('main-content');
    mainContent.insertAdjacentElement('afterend', paginationContainer);
};

// Event listener for changing page size
window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        itemsPerPage = 3; // Small screens like phones
    } else if (window.innerWidth < 992) {
        itemsPerPage = 5; // Medium screens like tablets
    } else {
        itemsPerPage = 5; // Large screens like computers
    }

    displayFeedData(currentPage, itemsPerPage);
});
