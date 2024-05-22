// Importing configuration and utility functions
import config from './dapp-config.js';
import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { loadChatConversation } from './ui/ui-ai-chat.js';

// Initialize a local PouchDB instance with config settings
const localDb = new PouchDB(config.localDbName);

// Event listener for when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    isLoggedIn(localDb)
        .then(loggedIn => {
            if (!loggedIn) {
                // Redirect to login page if not logged in
                window.location.replace('./login.html');
            } else {
                // Log status and initialize UI components
                console.log('User is logged in. Initializing DB and UI components...');
                loadMenu(localDb, 'dapp_menu');
                loadMainContentControls(localDb, 'dapp_controls');
                loadNetworkDataRegularly();
            }
        })
        .catch(err => {
            // Log any error during login check
            console.error('Error while checking if user is logged in:', err);
        });
});

// Function to load network data from the database
const loadNetworkData = async () => {
    try {
        // Retrieve network data from the database
        const networkData = await localDb.get('network');
        // Render network items using the retrieved data
        renderNetworkItems(networkData.network.data);
    } catch (err) {
        // Log errors if the data loading fails
        console.error('Error loading network data:', err);
    }
};

// Set an interval to regularly load network data
const loadNetworkDataRegularly = () => {
    loadNetworkData(); // Load network data immediately
    setInterval(loadNetworkData, 10000); // Set interval to reload every 10 seconds
};

// Function to render network items into the UI
const renderNetworkItems = (data) => {
    // Access the main content container in the DOM
    const feedContainer = document.getElementById('main-content');
    feedContainer.innerHTML = ''; // Clear any existing content

    // Combine all network items into one array
    const allItems = [...data.websites.data, ...data.contacts.data, ...data.devices.data];
    // Create card elements for all network items
    const cards = createNetworkCards(allItems);
    // Append cards to the main content container
    feedContainer.appendChild(cards);
};

// Function to create HTML card elements for each network item
const createNetworkCards = (items) => {
    // Create a container for rows of cards
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 g-4 row-spacing';

    // Loop through each item in the data array
    items.forEach((item, index) => {
        // Create a column for each card
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        // Create a card element
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${index + 1}`;

        // Create a container for the image
        const cardImageContainer = document.createElement('div');
        cardImageContainer.className = 'card-img-top-container';

        // Create an image element for the thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.src = item.thumbnail_url || 'https://picsum.photos/200';
        thumbnail.className = 'card-img-top';
        thumbnail.alt = item.description || 'No Description Available';

        // Check if item is a website to make thumbnail clickable
        if (item.url) {
            const cardLink = document.createElement('a');
            cardLink.href = item.url;
            cardLink.target = '_blank';
            cardLink.appendChild(thumbnail);
            cardImageContainer.appendChild(cardLink);
        } else {
            cardImageContainer.appendChild(thumbnail);
        }
        
        // Append the image container to the card
        card.appendChild(cardImageContainer);

        // Create a body for the card
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        // Create text content for the card
        const content = document.createElement('p');
        content.className = 'card-text';

        // Determine content based on item type
        if (item.email) { // Assume it's a contact if email is present
            content.textContent = `${item.name}, ${item.email}, ${item.relationship}`;
        } else if (item.type) { // Assume it's a device if type is present
            content.textContent = `${item.name}, ${item.type}, ${item.location}`;
        } else { // Default to using usefulness description for websites
            content.textContent = item.usefulness_description;
        }

        // Append content to the card body
        cardBody.appendChild(content);
        card.appendChild(cardBody);

        // Create a footer for the card
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer d-flex justify-content-between align-items-center';

        // Create a button for initiating AI chat
        const aiChatButton = document.createElement('button');
        aiChatButton.className = 'btn btn-primary ai-chat-button';
        aiChatButton.textContent = '';
        aiChatButton.setAttribute('aria-label', 'Initiate AI Chat for this task');
        aiChatButton.setAttribute('title', 'Initiate AI Chat');
        aiChatButton.addEventListener('click', () => openChatModal(item._id, item.category, item.description));
        cardFooter.appendChild(aiChatButton);

        // Create a badge for the category
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'badge bg-primary';
        categoryBadge.textContent = item.category || 'Unknown Category';
        cardFooter.appendChild(categoryBadge);

        // Append the footer to the card
        card.appendChild(cardFooter);
        colDiv.appendChild(card);
        rowDiv.appendChild(colDiv);
    });

    // Return the complete row containing all cards
    return rowDiv;
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
    loadChatConversation('network_feedback', _id);

    // Open the modal using Bootstrap's JavaScript API.
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show();
};

// Export the loadNetworkData function
export { loadNetworkData };
