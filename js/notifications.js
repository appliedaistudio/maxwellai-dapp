import config from './dapp-config.js';

import { isLoggedIn } from './ui/ui-auth.js';
import { loadMenu } from './ui/ui-menu.js';
import { loadMainContentControls } from './ui/ui-controls.js';

import { loadChatConversation } from './ui/ui-ai-chat.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

let currentPage = 1; // Define currentPage globally

document.addEventListener('DOMContentLoaded', () => {
    isLoggedIn(localDb).then(loggedIn => {
        if (!loggedIn) {
            window.location.replace('./login.html');
        } else {
            console.log('User is logged in. Initializing DB and UI components...');

            // Proceed with initializing UI components
            loadMenu(localDb, 'hello_world_menu');
            loadMainContentControls(localDb, 'hello_world_controls');
            loadNotificationsRegularly();
        }
    }).catch(err => {
        console.error('Error while checking if user is logged in:', err);
    });
});

let PAGE_SIZE = 5; // Default number of tasks per page

const loadNotifications = async () => {
    try {
        const notificationsData = await localDb.get('notifications');
        renderNotifications(notificationsData.notifications);
    } catch (err) {
        console.error('Could not fetch notifications from PouchDB:', err);
    }
};

// Define a function to load notifications at regular intervals
const loadNotificationsRegularly = () => {
    loadNotifications(); // Load notifications immediately

    // Set interval to reload notifications every 10 seconds
    setInterval(loadNotifications, 10000); // 10 seconds = 10000 milliseconds
};

const renderNotifications = (notifications) => {
    const notificationsContainer = document.getElementById('main-content');
    notificationsContainer.innerHTML = ''; // Clear existing content

    const paginatedNotifications = paginate(notifications, currentPage, PAGE_SIZE);
    const table = createNotificationTable(paginatedNotifications);
    notificationsContainer.appendChild(table);

    renderPagination(notifications.length);
};

const createNotificationTable = (notifications) => {
    const table = document.createElement('table');
    table.className = 'table notification-table'; // Added class for styling
    table.id = 'notification-table'; // Unique ID for the table

    // Create table header
    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Notification/Actions', 'AI']; // Updated table headers
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    header.appendChild(headerRow);
    table.appendChild(header);

    // Create table body
    const body = document.createElement('tbody');
    notifications.forEach((notification, index) => {
        const row = document.createElement('tr');
        row.className = 'notification-row'; // Added class for styling
        row.id = `row-${index + 1}`; // Unique ID for each row

        // Create cell for actions
        const actionsCell = document.createElement('td');

        // Add the notification body as the first line of text
        const bodyText = document.createElement('p');
        bodyText.textContent = notification.body;
        actionsCell.appendChild(bodyText);

        // Create comma-separated list for actions
        const actionsList = document.createElement('p');
        actionsList.textContent = "Actions: ";
        const actionsText = notification.actions.close.map(action => `Close ${action}`).concat(notification.actions.open.map(action => `Open ${action}`)).join(", ");
        actionsList.textContent += actionsText;
        actionsCell.appendChild(actionsList);
        actionsCell.setAttribute('title', 'Actions');

        // Create date badge
        const dateBadge = document.createElement('span');
        const date = new Date(notification.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        dateBadge.textContent = date;
        dateBadge.className = 'badge bg-info date-badge'; // Added class for styling
        dateBadge.setAttribute('title', 'Date');

        // Append date badge to actions cell
        actionsCell.appendChild(dateBadge);

        row.appendChild(actionsCell);

        // Create cell for AI chat button
        const aiChatCell = document.createElement('td');
        const aiChatButton = document.createElement('button');
        aiChatButton.textContent = '';
        aiChatButton.className = 'btn btn-primary ai-chat-button'; // Added class for styling
        aiChatButton.setAttribute('aria-label', 'Initiate AI Chat for this notification');
        aiChatButton.setAttribute('title', 'Initiate AI Chat');

        // Pass the necessary notification details as arguments to openChatModal
        aiChatButton.addEventListener('click', () => openChatModal(notification._id, notification.topic, notification.body));
        
        aiChatCell.appendChild(aiChatButton);
        row.appendChild(aiChatCell);

        // Create cell for topic badge
        const topicBadge = document.createElement('span');
        topicBadge.textContent = notification.topic;
        topicBadge.className = 'badge bg-primary topic-badge'; // Added class for styling
        topicBadge.setAttribute('title', 'Topic');
        actionsCell.appendChild(topicBadge);

        // Create cell for status badge
        const statusBadge = document.createElement('span');
        statusBadge.textContent = notification.status;
        statusBadge.className = 'badge bg-secondary status-badge'; // Added class for styling
        statusBadge.setAttribute('title', 'Status');
        actionsCell.appendChild(statusBadge);

        // Append row to table body
        body.appendChild(row);
    });
    table.appendChild(body);

    return table;
};


const renderPagination = (totalNotifications) => {
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
    } else {
        paginationContainer.innerHTML = ''; // Clear existing pagination
    }
    paginationContainer.id = 'pagination-container'; // Unique ID for the pagination container

    const totalPages = Math.ceil(totalNotifications / PAGE_SIZE);

    if (totalPages > 1) {
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Notification Pagination');
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
                loadNotifications();
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
                loadNotifications();
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
                loadNotifications();
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
    if (window.innerWidth < 768) {
        PAGE_SIZE = 1; // Small screens like phones
    } else if (window.innerWidth < 992) {
        PAGE_SIZE = 3; // Medium screens like tablets
    } else {
        PAGE_SIZE = 3; // Large screens like computers
    }

    loadNotifications();
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
    loadChatConversation('notification_feedback', _id);

    // Open the modal using Bootstrap's JavaScript API.
    const chatModalInstance = new bootstrap.Modal(chatModal);
    chatModalInstance.show();
};

adjustPageSize();
window.addEventListener('resize', adjustPageSize);

export {loadNotifications}
