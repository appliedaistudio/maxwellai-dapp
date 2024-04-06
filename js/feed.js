import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { loadChatConversation } from './ui/ui-ai-chat.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Define constant mapping between page size and items per page
const PAGE_SIZE_MAPPING = {
    extraSmall: 2,
    small: 4,
    medium: 6,
    large: 6,
    extraLarge: 6
};

let PAGE_SIZE = PAGE_SIZE_MAPPING.medium; // Default number of items per page for medium screens
let currentPage = 1; // Define currentPage globally

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb)
        .then(loggedIn => {
            if (!loggedIn) {
                window.location.replace('./login.html');
            } else {
                console.log('User is logged in. Initializing DB and UI components...');

                // Proceed with initializing UI components
                loadMenu(localDb, 'hello_world_menu');
                loadMainContentControls(localDb, 'hello_world_controls');
                loadFeedRegurlarly();
            }
        })
        .catch(err => {
            console.error('Error while checking if user is logged in:', err);
        });
});

const loadFeed = async () => {
    try {
        const feedData = await localDb.get('maxwell_ai_feed');
        renderFeed(feedData.urls_to_browse);
    } catch (err) {
        console.error('Error loading feed data:', err);
    }
};

// Define a function to load feed at regular intervals
const loadFeedRegurlarly = () => {
    loadFeed(); // Load feed immediately

    // Set interval to reload feed every 10 seconds
    setInterval(loadFeed, 10000); // 10 seconds = 10000 milliseconds
};

const renderFeed = (feed) => {
    const feedContainer = document.getElementById('main-content');
    feedContainer.innerHTML = ''; // Clear existing content

    const paginatedFeed = paginate(feed, currentPage, PAGE_SIZE);
    const cards = createFeedCards(paginatedFeed);
    feedContainer.appendChild(cards);

    renderPagination(feed.length);
};

const createFeedCards = (feed) => {
    const maxDescriptionLength = 75; // Global variable defining the maximum length of the description

    const rowDiv = document.createElement('div');
    rowDiv.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 g-4';

    feed.forEach((item, index) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col custom-card-col'; // Added custom class

        const card = document.createElement('div');
        card.className = 'card h-100 custom-card'; // Added custom class
        card.id = `card-${index + 1}`; // Unique ID for each card

        const cardLink = document.createElement('a');
        cardLink.href = item.url;
        cardLink.target = '_blank'; // Open link in a new window
        cardLink.title = item.description; // Tooltip for the card
        cardLink.className = 'card-link'; // Added custom class

        const thumbnail = document.createElement('img');
        thumbnail.src = item.thumbnail_url;
        thumbnail.className = 'card-img-top custom-card-img'; // Added custom class for image styling
        thumbnail.alt = item.description;
        thumbnail.title = item.description; // Tooltip for the thumbnail
        cardLink.appendChild(thumbnail);

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body custom-card-body'; // Added custom class

        const usefulnessDescription = document.createElement('p');
        usefulnessDescription.className = 'card-text';
        
        // Truncate the description only at the end of a word
        if (item.usefulness_description.length > maxDescriptionLength) {
            let truncatedDescription = item.usefulness_description.substring(0, maxDescriptionLength);
            // Find the last space within the first `maxDescriptionLength` characters
            const lastSpaceIndex = truncatedDescription.lastIndexOf(' ');
            if (lastSpaceIndex !== -1) {
                truncatedDescription = truncatedDescription.substring(0, lastSpaceIndex) + '...';
            } else {
                truncatedDescription += '...';
            }
            usefulnessDescription.textContent = truncatedDescription;
            usefulnessDescription.title = item.usefulness_description; // Tooltip for the truncated description
        } else {
            usefulnessDescription.textContent = item.usefulness_description;
        }
        
        cardBody.appendChild(usefulnessDescription);

        card.appendChild(cardLink);
        card.appendChild(cardBody);

        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer d-flex justify-content-between align-items-center custom-card-footer'; // Added custom class

        const reviewBadge = document.createElement('span');
        reviewBadge.className = 'badge bg-primary custom-review-badge'; // Added custom class
        reviewBadge.textContent = item.review_status;
        reviewBadge.title = 'Review Status'; // Tooltip for the status badge
        cardFooter.appendChild(reviewBadge);

        const aiChatButton = document.createElement('button');
        aiChatButton.className = 'btn btn-primary ai-chat-button custom-ai-chat-button'; // Added custom class
        aiChatButton.textContent = '';
        aiChatButton.setAttribute('aria-label', 'Initiate AI Chat for this task');
        aiChatButton.setAttribute('title', 'Initiate AI Chat');

        // Pass the necessary task details as arguments to openChatModal
        aiChatButton.addEventListener('click', () => openChatModal(item._id, item.category, item.description));

        cardFooter.appendChild(aiChatButton);

        card.appendChild(cardFooter);
        colDiv.appendChild(card);
        rowDiv.appendChild(colDiv);
    });

    return rowDiv;
};

const renderPagination = (totalResources) => {
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
    } else {
        paginationContainer.innerHTML = ''; // Clear existing pagination
    }
    paginationContainer.id = 'pagination-container'; // Unique ID for the pagination container

    const totalPages = Math.ceil(totalResources / PAGE_SIZE);

    if (totalPages > 1) {
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Resource Pagination');
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
                loadFeed();
            }
        });
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);

        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
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
                loadFeed();
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
                loadFeed();
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
    if (window.innerWidth < 576) {
        PAGE_SIZE = PAGE_SIZE_MAPPING.extraSmall; // Extra Small screens
    } else if (window.innerWidth < 768) {
        PAGE_SIZE = PAGE_SIZE_MAPPING.small; // Small screens like phones
    } else if (window.innerWidth < 992) {
        PAGE_SIZE = PAGE_SIZE_MAPPING.medium; // Medium screens like tablets
    } else if (window.innerWidth < 1200) {
        PAGE_SIZE = PAGE_SIZE_MAPPING.large; // Large screens like desktops
    } else {
        PAGE_SIZE = PAGE_SIZE_MAPPING.extraLarge; // Extra Large screens
    }

    loadFeed();
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
    loadChatConversation('maxwellai_feed_feedback', _id);

    // Open the modal using Bootstrap's JavaScript API.
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show();
};

adjustPageSize();
window.addEventListener('resize', adjustPageSize);

export {loadFeed}