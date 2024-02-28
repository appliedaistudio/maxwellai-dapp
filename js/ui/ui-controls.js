import config from '../dapp-config.js';

import { loadChatConversation } from './ui-ai-chat.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Mapping icon names to conversation ids
const iconNameToConversationIdMapping = {
  'you': 1,
  'your aspirations': 2,
  'your environment': 3
};

// This function initializes UI controls after the page has loaded and PouchDB setup is complete.
export function loadMainContentControls(db, controlsId) {
  db.get(controlsId).then(function (controlsData) {
      var controlsContainer = document.createElement('div');
      // Set unique id for the container to adhere to the standard.
      controlsContainer.id = 'controls-container';
      controlsContainer.classList.add('controls-container');

      // Loop over controls data to create button elements for each control icon.
      controlsData.icons.forEach(function (icon, index) {
          var controlButton = document.createElement('button');
          // Assign unique id for each control button.
          controlButton.id = `control-button-${index}`;
          controlButton.classList.add('control-button');
          // Title attribute serves as the tooltip providing description of the button's action.
          controlButton.setAttribute('title', icon.tooltip);
          // Use iconClass to render font icon. Icons must use classes instead of <img>, so alt attribute doesn't apply here.
          controlButton.innerHTML = `<i class="${icon.iconClass}" aria-hidden="true"></i>`;

          // Add click event listener for icon actions.
          controlButton.addEventListener('click', function() {
              executeControlFunction(icon.name);
          });

          controlsContainer.appendChild(controlButton);
      });

      // Append the container to an existing element in the document.
      document.getElementById('app-content').appendChild(controlsContainer);
  }).catch(function (err) {
      console.error('Error loading control icons:', err);
  });
}

const openChatModal = () => {
  const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
  chatModal.show();
};

// Function called when an icon is clicked.
function executeControlFunction(iconName) {

  const chatModal = document.getElementById('chatModal');
  const modalTitle = chatModal.querySelector('.modal-title');
  const modalBody = chatModal.querySelector('.modal-body');

  // Set modal title and body.
  // Note: This will replace any existing content in the title.
  modalTitle.textContent = `We're talking about ${iconName}`;

  // Load conversation data
  const conversationId = iconNameToConversationIdMapping[iconName]
  loadChatConversation('maxwellai_project_feedback', conversationId)

  openChatModal();
}