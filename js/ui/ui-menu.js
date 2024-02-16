// Import functions from external libraries as needed
import { logoutUser } from './ui-auth.js';

// Define a mapping from option names to objects containing function and params
const optionFunctionMappings = {
    'Logout': {
        func: logoutUser, // The function to execute
        params: [] // Parameters to pass to the function
    }
    // Add other options here as needed
};

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

            // Use class 'dropdown-item' for each item styling, including tooltip (title) directly from data
            option.items.forEach((item, itemIndex) => {
                const itemId = `${optionId}-item-${itemIndex}`;
                menuHtml += `<a id="${itemId}" class="dropdown-item" href="#" data-option="${item.name}" title="${item.tooltip}">${item.name}</a>`; // Use tooltip from data, provide unique id
            });

            menuHtml += '</div></div>';
        });

        menuHtml += '</nav>';
        document.getElementById('menu-container').innerHTML = menuHtml;

        // Add click event listeners to all dropdown items after rendering to the DOM
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
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
    alert(`Menu option clicked: ${optionName}`);

    if (optionFunctionMappings.hasOwnProperty(optionName)) {
        const mapping = optionFunctionMappings[optionName];

        // Check if params is an array and if so, make a copy and unshift the db to the parameters
        if (Array.isArray(mapping.params)) {
            const paramsWithDb = [db, ...mapping.params];
            mapping.func(...paramsWithDb);
        } else {
            // Call the function with db as the only parameter
            mapping.func(db);
        }
    } else {
        alert(`No function found for menu option: ${optionName}`);
        console.error(`No function found for menu option: ${optionName}`);
    }
}
