// Import functions from external libraries as needed
import { logoutUser } from './ui-auth.js';
import config from '../dapp-config.js';

// Define a mapping from option names to objects containing function and params
const optionFunctionMappings = {
    'Logout': {
        func: logoutUser, // The function to execute
        params: [] // Parameters to pass to the function
    },
    'Small, Meaningful Tasks': {
        func: navigateToScreen, // The function to execute
        params: 'tasks.html' // Directly provide the URL string
    },
    'Resources and Ideas': {
        func: navigateToScreen, // The function to execute
        params: 'feed.html' // Directly provide the URL string
    },
    'Helpful Interventions': {
        func: navigateToScreen, // The function to execute
        params: 'notifications.html' // Directly provide the URL string
    },
    'MaxwellAI Settings': {
        func: openSettingsModal, // The function to execute
        params: '' // No parameters needed
    }
    // Add other options here as needed
};

// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Function to be called when the save button is clicked on the settings modal
async function saveSettings() {
    try {
        // Fetch the existing settings document from localDb
        const doc = await localDb.get('dapp_settings');
        const settings = doc.settings;

        // Get all input fields within the form
        const inputFields = document.querySelectorAll('#configForm input');

        // Update settings object with new values from input fields
        inputFields.forEach(input => {
            const key = input.id;
            const value = input.value;
            settings[key] = value;
        });

        // Update the settings document in localDb
        await localDb.put({
            _id: 'dapp_settings',
            _rev: doc._rev, // Include the revision to avoid conflicts
            settings: settings
        });

    } catch (error) {
        console.error('Error saving settings:', error);
        // Optionally handle errors here, e.g., show an error message to the user
    }
}

// Get the save button element on the settings modal dialog
const saveButton = document.getElementById('saveSettingsBtn');

// Add an event listener to the save button
saveButton.addEventListener('click', function() {
    saveSettings(); // Call the saveSettings function when the save button is clicked
});

// Update the openSettingsModal function
async function openSettingsModal() {
    const configModal = new bootstrap.Modal(document.getElementById('settingsModal'));

    try {
        // Fetch settings from localDb
        const doc = await localDb.get('dapp_settings');
        const settings = doc.settings;

        // Get the form element where settings will be populated
        const configForm = document.getElementById('configForm');

        // Clear any existing input fields
        configForm.innerHTML = '';

        // Iterate through each setting and create input fields
        for (const key in settings) {
            if (Object.hasOwnProperty.call(settings, key)) {
                const value = settings[key];

                // Create input field and label
                const inputDiv = document.createElement('div');
                inputDiv.classList.add('mb-3');

                const label = document.createElement('label');
                label.setAttribute('for', key);
                label.classList.add('form-label');
                label.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');

                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                input.setAttribute('class', 'form-control');
                input.setAttribute('id', key);
                input.setAttribute('value', value);

                // Append label and input to form
                inputDiv.appendChild(label);
                inputDiv.appendChild(input);
                configForm.appendChild(inputDiv);
            }
        }

        // Show the modal
        configModal.show();
    } catch (error) {
        console.error('Error fetching settings:', error);
        // Optionally handle errors here, e.g., show an error message to the user
    }
}

function navigateToScreen(url) {
    window.location.href = url; // Change the URL to navigate to the new screen
}

// Function to load menu dynamically
export function loadMenu(db, menuId) {
    db.get(menuId).then(function (doc) {
        const menuOptions = doc.options;
        let menuHtml = '<nav class="btn-group menu-group" role="group" aria-label="Main Navigation">'; // Use <nav> with aria-label

        menuOptions.forEach((option, index) => {
            // Generate unique IDs for accessibility
            const optionId = `option-${option._id}-${index}`;
            
            // Use class 'menu-button' and 'dropdown-toggle' for button styling
            // Including tooltip (title attribute) directly from data
            menuHtml += `
                <div class="btn-group" role="group">
                    <button id="${optionId}"
                        type="button"
                        class="btn menu-button dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                        title="${option.tooltip}">
                        ${option.name}
                    </button>
                    <div class="dropdown-menu" aria-labelledby="${optionId}">`;

            // Use class 'menu-dropdown-item' specifically for menu items, including tooltip (title) directly from data
            option.items.forEach((item, itemIndex) => {
                const itemId = `${optionId}-item-${itemIndex}`;
                menuHtml += `<a id="${itemId}" class="dropdown-item menu-dropdown-item" href="#" data-option="${item.name}" title="${item.tooltip}">${item.name}</a>`; // Use tooltip from data, provide unique id
            });

            menuHtml += '</div></div>';
        });

        menuHtml += '</nav>';
        document.getElementById('menu-container').innerHTML = menuHtml;

        // Add click event listeners to menu dropdown items after rendering to the DOM
        const menuDropdownItems = document.querySelectorAll('.menu-dropdown-item');
        menuDropdownItems.forEach(item => {
            item.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default anchor behavior
                const optionName = this.getAttribute('data-option');
                executeMenuOption(db, optionName); // Pass the db to executeMenuOption
            });
        });

    }).catch(function (err) {
        console.error('Error loading menu data:', err);
    });
}

// Function to execute menu option based on the option name
function executeMenuOption(db, optionName) {

    if (optionFunctionMappings.hasOwnProperty(optionName)) {
        const mapping = optionFunctionMappings[optionName];

        // Check if params is an array, if not, call the function directly
        if (Array.isArray(mapping.params)) {
            mapping.func(db, ...mapping.params);
        } else {
            mapping.func(mapping.params); // Call the function with the provided parameter
        }
    } else {
        alert(`No function found for menu option: ${optionName}`);
        console.error(`No function found for menu option: ${optionName}`);
    }
}
