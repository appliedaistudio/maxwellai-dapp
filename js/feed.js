import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

// Global variables for pagination
let currentPage = 1;
const itemsPerPage = 4; // Number of feed items per page

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

// Fetch and display feed data function with pagination
function displayFeedData(localDb, page) {
    localDb.get('maxwell_ai_feed').then((doc) => {
        const mainContent = document.getElementById('main-content');
        // Calculate the subset of items for the current page
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = doc.urls_to_browse.slice(start, end);
        
        // Generate HTML for feed items on the current page
        let cardsHtml = '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">';
        pageItems.forEach((item) => {
            cardsHtml += `
                <div class="col">
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
                </div>
            `;
        });
        cardsHtml += '</div>';
        
        // Add pagination controls
        const totalItems = doc.urls_to_browse.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        cardsHtml += generatePaginationControls(currentPage, totalPages);
        
        mainContent.innerHTML = cardsHtml;
        
        // Add click listeners to pagination buttons
        addPaginationListeners(localDb);
    }).catch((err) => {
        console.error('Error loading feed data:', err);
    });
}

// Function to generate pagination controls
function generatePaginationControls(currentPage, totalPages) {
    let controlsHtml = '<nav aria-label="Page navigation example"><ul class="pagination justify-content-center">';
    for (let i = 1; i <= totalPages; i++) {
        controlsHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    controlsHtml += '</ul></nav>';
    return controlsHtml;
}

// Function to add click listeners to pagination buttons
function addPaginationListeners(localDb) {
    const paginationLinks = document.querySelectorAll('.pagination a.page-link');
    paginationLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const page = parseInt(event.target.dataset.page);
            currentPage = page;
            displayFeedData(localDb, page);
        });
    });
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
            // Call the function to display feed data with pagination
            displayFeedData(localDb, currentPage);
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});