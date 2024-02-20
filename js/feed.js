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

    paginatedItems.forEach((item, index) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col custom-card-col'; // Added custom class

        const card = document.createElement('div');
        card.className = 'card h-100 custom-card'; // Added custom class
        card.id = `card-${startIndex + index + 1}`; // Unique ID for each card

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

        const categoryTitle = document.createElement('h5');
        categoryTitle.className = 'card-title';
        categoryTitle.textContent = item.category;
        cardBody.appendChild(categoryTitle);

        const usefulnessDescription = document.createElement('p');
        usefulnessDescription.className = 'card-text';
        usefulnessDescription.textContent = item.usefulness_description;
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
    ul.id = 'pagination-list'; // Unique ID for the pagination list

    const prevLi = document.createElement('li');
    prevLi.className = 'page-item';
    prevLi.id = 'prev-page-item'; // Unique ID for the previous page item
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Previous';
    prevLink.title = 'Go to Previous Page'; // Tooltip for previous page button
    prevLink.id = 'prev-page-link'; // Unique ID for the previous page link
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
        li.id = `page-item-${i}`; // Unique ID for each page item
        const link = document.createElement('a');
        link.className = 'page-link';
        link.href = '#';
        link.textContent = i;
        link.title = `Go to Page ${i}`; // Tooltip for each page button
        link.id = `page-link-${i}`; // Unique ID for each page link
        link.addEventListener('click', (event) => {
            currentPage = parseInt(event.target.textContent);
            displayFeedData(currentPage, pageSize);
        });
        li.appendChild(link);
        ul.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = 'page-item';
    nextLi.id = 'next-page-item'; // Unique ID for the next page item
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Next';
    nextLink.title = 'Go to Next Page'; // Tooltip for next page button
    nextLink.id = 'next-page-link'; // Unique ID for the next page link
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

const openChatModal = (_id, category, description) => {
    console.log("Opening chat for task:", _id, category, description); // Example usage of the passed parameters

    // Here you can use the _id, category, and description to adjust the modal content or behavior.
    // Let's set these as the modal's title or part of its body content.
    
    const chatModal = document.getElementById('chatModal');
    const modalTitle = chatModal.querySelector('.modal-title');
    const modalBody = chatModal.querySelector('.modal-body');

    // Set modal title and body.
    // Note: This will replace any existing content in the title.
    modalTitle.textContent = `Let's Chat About ${category}`;

    // Load the existing chat conversation
    loadChatConversation('maxwellai_feed_feedback', 'feed_feedback', _id);

    // Open the modal using Bootstrap's JavaScript API.
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show();
};

// Load a stored conversation into the chat window
async function loadChatConversation(data_name, nodeName, conversationId) {
    
    // Fetch the data from PouchDB
    const data = await localDb.get(data_name);

    const chatWindow = document.getElementById('chat-body');
    chatWindow.innerHTML = '';  // Clear existing messages

    try {
        // Find the conversation corresponding to the given ID
        const conversation = data[nodeName].find(item => item._id === conversationId);
        
        if (!conversation) {
            console.error('Conversation not found.');
            return;
        }

        // Set the tooltip for the chat header to be the concatenation of all takeaway contents
        const chatHeader = document.getElementById('chat-header');
        chatHeader.title = `Takeaway: ${Object.values(conversation.takeaway).join('\n')}`;

        // Iterate over dialogue and format the messages
        conversation.dialogue.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = `${message.speaker}: ${message.text}`;
            
            // Apply different classes based on the speaker for styling
            messageDiv.className = message.speaker === 'AI' ? 'ai-message' : 'user-message';

            // Add tooltip for each message
            messageDiv.title = message.text;

            chatWindow.appendChild(messageDiv);
            chatWindow.appendChild(document.createElement('br')); // Add line break after each message
        });

    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}


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
