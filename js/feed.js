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
    setInterval(loadFeed, 1000000); // 10 seconds = 10000 milliseconds
};

const renderFeed = (feed) => {
    const feedContainer = document.getElementById('main-content');
    feedContainer.innerHTML = ''; // Clear existing content

    const cards = createFeedCards(feed);
    feedContainer.appendChild(cards);
};

const createFeedCards = (feed) => {
    const maxDescriptionLength = 75; // Global variable defining the maximum length of the description

    const rowDiv = document.createElement('div');
    rowDiv.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 g-4 row-spacing'; // Added 'row-spacing' for custom margin

    feed.forEach((item, index) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${index + 1}`;

        const cardLink = document.createElement('a');
        cardLink.href = item.url;
        cardLink.target = '_blank';
        cardLink.title = item.description;

        const thumbnail = document.createElement('img');
        thumbnail.src = item.thumbnail_url;
        thumbnail.className = 'card-img-top';
        thumbnail.alt = item.description;
        thumbnail.title = item.description;
        cardLink.appendChild(thumbnail);

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const usefulnessDescription = document.createElement('p');
        usefulnessDescription.className = 'card-text';
        
        if (item.usefulness_description.length > maxDescriptionLength) {
            let truncatedDescription = item.usefulness_description.substring(0, maxDescriptionLength);
            const lastSpaceIndex = truncatedDescription.lastIndexOf(' ');
            truncatedDescription = lastSpaceIndex !== -1 ? truncatedDescription.substring(0, lastSpaceIndex) + '...' : truncatedDescription + '...';
            usefulnessDescription.textContent = truncatedDescription;
            usefulnessDescription.title = item.usefulness_description;
        } else {
            usefulnessDescription.textContent = item.usefulness_description;
        }
        
        cardBody.appendChild(usefulnessDescription);

        card.appendChild(cardLink);
        card.appendChild(cardBody);

        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer d-flex justify-content-between align-items-center';

        const reviewBadge = document.createElement('span');
        reviewBadge.className = 'badge bg-primary';
        reviewBadge.textContent = item.review_status;
        reviewBadge.title = 'Review Status';
        cardFooter.appendChild(reviewBadge);

        const aiChatButton = document.createElement('button');
        aiChatButton.className = 'btn btn-primary ai-chat-button';
        aiChatButton.textContent = '';
        aiChatButton.setAttribute('aria-label', 'Initiate AI Chat for this task');
        aiChatButton.setAttribute('title', 'Initiate AI Chat');

        aiChatButton.addEventListener('click', () => openChatModal(item._id, item.category, item.description));

        cardFooter.appendChild(aiChatButton);

        card.appendChild(cardFooter);
        colDiv.appendChild(card);
        rowDiv.appendChild(colDiv);
    });

    return rowDiv;
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