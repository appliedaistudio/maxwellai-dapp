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
    setInterval(loadFeed, 10000); // 10 seconds = 10000 milliseconds
};

const renderFeed = (feed) => {
    const feedContainer = document.getElementById('main-content');
    feedContainer.innerHTML = ''; // Clear existing content

    const cards = createFeedCards(feed);
    feedContainer.appendChild(cards);
};

const createFeedCards = (feed) => {
    // Create a row container for the cards
    const rowDiv = document.createElement('div');
    // Set responsive grid layout
    rowDiv.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 g-4 row-spacing';

    feed.forEach((item, index) => {
        // Column div for each card
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        // Create the card element
        const card = document.createElement('div');
        card.className = 'card';
        // Assign a unique ID to each card
        card.id = `card-${index + 1}`;

        // Create a link that wraps the image
        const cardLink = document.createElement('a');
        cardLink.href = item.url;
        // Ensures link opens in a new tab
        cardLink.target = '_blank';
        cardLink.title = item.description;

        // Thumbnail image for the card
        const thumbnail = document.createElement('img');
        thumbnail.src = item.thumbnail_url;
        thumbnail.className = 'card-img-top';
        thumbnail.alt = item.description;
        // Tooltip showing description
        thumbnail.title = item.description;
        cardLink.appendChild(thumbnail);

        // Container for the card content
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        // Description paragraph
        const usefulnessDescription = document.createElement('p');
        usefulnessDescription.className = 'card-text';
        // Display the full description as provided
        usefulnessDescription.textContent = item.usefulness_description;
        // Full description in tooltip
        usefulnessDescription.title = item.usefulness_description;
        cardBody.appendChild(usefulnessDescription);
        card.appendChild(cardLink);
        card.appendChild(cardBody);

        // Footer for the card containing actions and badges
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer d-flex justify-content-between align-items-center';

        // Badge showing review status
        const reviewBadge = document.createElement('span');
        reviewBadge.className = 'badge bg-primary';
        reviewBadge.textContent = item.review_status;
        // Tooltip for the badge
        reviewBadge.title = 'Review Status';
        cardFooter.appendChild(reviewBadge);

        // Button to initiate chat
        const aiChatButton = document.createElement('button');
        aiChatButton.className = 'btn btn-primary ai-chat-button';
        // Visible text for clarity
        aiChatButton.textContent = '';
        aiChatButton.setAttribute('aria-label', 'Initiate AI Chat for this task');
        aiChatButton.setAttribute('title', 'Initiate AI Chat');
        aiChatButton.addEventListener('click', () => openChatModal(item._id, item.category, item.description));
        cardFooter.appendChild(aiChatButton);

        card.appendChild(cardFooter);
        colDiv.appendChild(card);
        // Add the complete card to the row
        rowDiv.appendChild(colDiv);
    });

    // Return the complete row containing all cards
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