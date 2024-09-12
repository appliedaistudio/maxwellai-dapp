# PhysarAI Documentation

**Purpose**: Provide an overview and essential information to get started with the project. 

**Contents**: 
- [`Introduction`](#introduction): Title and Description

- [`Getting Started`](#getting-started): Prerequisites, Installing and Running the project

- [`Project Structure`](#project-structure): System Design and Architecture

- [`Development Guide`](#development-guide): (Coming Soon)

- [`Advanced Topics`](#advanced-topics): (Coming Soon)

- [`FAQ and Troubleshooting`](#faq-and-troubleshooting): (Coming Soon)

- [`Contribution Guide`](#contribution-guide): How to contribute, coding standards and guidelines, pull request process

- [`Appendix`](#appendix)


---
# PhysarAI DApp


## Introduction
PhysarAI DApp is a decentralized web application integrating AI functionalities. It is designed to run in a web browser with offline capabilities, allowing users to interact with our state of the art Artificial Intelligence program featuring a completely decentralized infrastructure that runs seamlessly on the client machine.


## Getting Started

### End-User Guide

##### Prerequisites
- A Web Browser

##### Installation
- None Required

##### Running the Project
1. Open your browser and go to https://appliedaistudio.github.io/maxwellai-dapp/.

2. Login using the following credentials:
   - Username: guest
   - Password: guest123


### Developer Guide

##### Prerequisites
- Visual Studio Code
- A local web server setup (e.g., Python's HTTP server or Live Preview - A VS Code Extension)
- Basic knowledge of HTML, CSS, and JavaScript

##### Installation
1. Download and Install Visual Studio Code:
  https://code.visualstudio.com/download

2. Install Live Preview:
  Using the Activity Bar on the far left-hand side of VS Code, navigate to the extenstions section and search for "Live Preview". Install the extension of the _**same name**_ that has officially been listed by Microsoft. This extensions allows setting up a local web server within your workspace to preview the app and if required also allows to access the server in an external web browser. 

3. Clone the repository and navigate to project folder:
    - Open a terminal and navigate using `cd` to the folder where you want to save the project.

    - Enter the following commands (make sure `git` is already installed): 

    ```bash
   git clone https://github.com/appliedaistudio/maxwellai-dapp.git
   cd maxwellai-dapp
    ```
   - If you prefer to not use a terminal and commands to carry out this step, you can do the following:
     - Download and Install GitHub Desktop through the following link: https://desktop.github.com/download/
     - Login using your GitHub account.
     - Click on `Add` and in the dropdown menu click on `Clone Repository`.
     - In the popup form click on URL, add the following https://github.com/appliedaistudio/maxwellai-dapp.git. 
     - Choose the Local Path where you want to clone the repository and finally click on clone.

##### Running the Project
1. Run VS Code and open the newly cloned project repository.

2. In the Explorer pane on the left-hand side, open `index.html`.

3. On the top right-hand corner, click on the second button `Open Preview` which is located beside the `Run Code` button.

4. Login using the following credentials and explore the app as you would on a browser:
    - Username: guest
    - Password: guest123


If you prefer to run a local web server by yourself instead:
1. Start the local web server:

   ```bash
   python3 -m http.server
   ```
2. Open your browser and go to http://localhost:8000.

##### Contribution
To get started on contributing to the project (fixing a bug or creating a new feature) refer to the [**`Contribution Guide`**](#contribution-guide) Section.


## Project Structure

### System Design

##### 1. **Architecture Overview**
The PhysarAI DApp is designed with a modular architecture that separates concerns across various components, ensuring that each part of the application is well-organized, maintainable, and scalable.

##### 2. **Core Components**
The project is structured into several key components, each responsible for different aspects of the application's functionality:

- **Frontend Components**:
  - **HTML Files**: These files define the structure and layout of the various pages of the application. The `index.html` serves as the main entry point, while others like `login.html`, `tasks.html`, `network.html`, `notifications.html`, and `diagnostics.html` provide interfaces for specific functionalities within the DApp.
  - **CSS Styles**: The CSS files, organized into `base`, `components`, `layout`, and `utils` manage the visual styling of the application. The `base` styles define fundamental elements like typography, while `components` handle the styling of specific UI elements like buttons and menus. `layout.css` manages the overall structure of the pages, while `responsive.css` utility implements responsive design techniques ensuring consistency and optimal performance across different devices and screen sizes.
  - **JavaScript (JS) Files**: The JS files are divided into subdirectories for database management (`db`), user interface (`ui`), utilities (`utils`), and AI-specific functionalities (`ai`). These scripts handle dynamic interactions within the application, such as user authentication, AI interactions, and data management. The `ai` folder contains scripts related to PhysarAI, which is the core AI module integrated into the application.

- **Backend Components**:
  - **OpenAI Interaction**: The only core backend component is the DApp's interaction with OpenAI's LLM. The `dapp-settings.json` script and some of the scripts in the `js/ai` subdirectory specifically cater to this.
  - **Service Worker**: The `service-worker.mjs` script functions as the brains of the DApp. It is a critical component that acts as a middleman between the frontend and the backend. It is a background process that manages caching, handles network requests, and continuously engages PhysarAI to update tasks, notifications, and network resources. It ensures the app remains functional and responsive, even offline, by running AI operations at regular intervals and in real-time, processing data insights, and maintaining seamless communication with the main application thread. This allows the application to operate intelligently and autonomously, enhancing the overall user experience.
    - It is responsible for:

      •	Caching Assets: During the installation phase, the service worker caches essential files such as the index.html, CSS, and JavaScript files to ensure the application can be loaded quickly and work offline.
      •	Handling Fetch Requests: The service worker intercepts network requests and serves them from the cache if available, falling back to network requests if necessary. This improves performance and ensures that the app remains usable even with intermittent connectivity.
      •	Managing Notifications: The service worker periodically checks for pending notifications stored in PouchDB and sends them to the user. It updates the status of notifications from “pending” to “sent” once they are delivered.
      •	Interacting with PhysarAI: The service worker runs iterations of PhysarAI in the background. It collects insights and actions from user interactions, updates tasks, notifications, and network resources based on AI-generated insights, and ensures the AI is engaged regularly at specified intervals.
      •	Engaging AI Regularly and in Real-time:
      •	Regular AI Engagement: The service worker engages the AI at regular intervals (e.g., every 3 minutes) to process data, update notifications, tasks, and networks, and manage other background operations.
      •	Real-time AI Engagement: In addition to regular intervals, the service worker can engage the AI more frequently (e.g., every 10 seconds) for tasks that require immediate attention.
      •	Managing Background Tasks: The service worker continuously runs and schedules tasks in the background, such as updating the UI, sending notifications, and processing data insights, ensuring that the user experience is seamless and responsive.
      •	Communicating with the Main Thread: The service worker listens for messages from the main application thread and can engage the AI or perform other tasks based on these messages. It also communicates back to the main thread by sending messages to update the UI or notify the user.

    - Key Functions and Operations

      1.	Installation and Activation:
          •	Caches essential files during installation to ensure the application can be loaded quickly and work offline.
          •	Claims control of all clients immediately upon activation.
          •	Activates the service worker to manage background operations and ensure the application remains functional and responsive.
      2.	Fetch Handling:
          •	Intercepts network requests and serves them from the cache if available.
          •	Falls back to network requests if the cache is not available.
          •	Serves cached responses for known URLs, improving performance and enabling offline usage.
      3.	Notification Management:
          •	Periodically checks for pending notifications from PouchDB and displays them to the user.
          •	Updates the status of notifications from “pending” to “sent” once they are delivered.
      4.	AI Engagement:
          • Gathers insights from user interactions stored in PouchDB.
          •	Updates tasks, notifications, and network resources based on AI-driven insights.
          •	Engages the AI at regular and real-time intervals, processing and acting on data continuously.
      5.	Message Handling:
          •	Listens for messages from the main thread and responds accordingly.
          •	Sends messages to the main thread to update the UI or notify the user.

##### 3. **Data Management**
- The application stores and manages various data states and configurations in the `data/substrates` directory. The folder contains specific data configurations for different aspects of the application, such as aging-in-place, conference productivity, and cybersecurity productivity. Each subfolder contains JSON files that hold structured data used by the application to manage tasks, network configurations, user feedback, and more.
- The `substrate-data-templates` folder contains text files that serve as templates that are fed to an LLM like ChatGPT in order to generate seed substrate data for a new substrate.
- **PouchDB**: A client-side database used for storing and synchronizing data. The `js/db` folder contains initialization scripts for various databases like users, tasks, and notifications. These scripts are essential for setting up and managing local data storage, ensuring that the application can operate offline and synchronize data when a connection is available.

##### 4. **User Interface (UI)**
The UI is highly modular, with specific styles and scripts dedicated to different components of the application. 

- **Bootstrap**: A popular front-end framework. It has been utilized mainly to compliment the DApp's CSS and JS based design efforts in HTML files and to enable the usage of the design template of a `modal` interface component specifically for the AI chat, notifications and login alerts.
- **UI Controls and Interactions**: Managed by the `ui-controls.js` and related files, these scripts handle the dynamic behavior of the UI elements, such as menus, buttons, and forms.
- **AI Interaction**: The AI-related interactions, managed by `ui-ai-chat.js`, allow users to interact with the AI models integrated into the application. These interactions are designed to be intuitive and responsive, providing real-time feedback to the user.
- **User Authentication**: The User Authentication processes, managed by `ui-auth.js`, allows login management, session management, and access level checks using PouchDB and bcrypt for a secure login system.

##### 5. **AI Integration**
The `js/ai` directory contains the core AI functionalities, including scripts for managing AI conversations, configuring AI models, and interacting with large language models (LLMs). The PhysarAI module is the main AI component of the application, providing advanced AI capabilities such as natural language processing and knowledge management.

##### 6. **Security and Performance**
The application leverages several key components to ensure security and optimal performance:
- **bcrypt**: A library used for hashing passwords, ensuring that user credentials are stored securely.
- **Encryption**: Managed by `encryption.js`, this script is a vital part of the DApp’s security infrastructure. It ensures that sensitive data is encrypted using the AES-GCM algorithm before being stored or transmitted, and can be securely decrypted when needed. The module manages the entire encryption and decryption process, using a static key and a random intialization vector (IV) to produce a unique cipher text, this algorithm combines with robust error handling protects user data and maintains the integrity of the application’s security mechanisms.
- **Performance Optimization**: The service worker and caching mechanisms improve the app's performance, especially in environments with limited or unreliable network connectivity. 

##### 7. **Documentation and Resources**
The `docs` directory contains documentation files that provide detailed information on the application’s setup, usage, and development. This documentation is crucial for onboarding new developers and ensuring that stakeholders have a clear understanding of the system’s capabilities.


### System Architecture

##### Diagram

![System Architecture Diagram](images/Architecture.png)


### Directory and File Breakdown

##### Root Directory
- `aiTest.html`: Interface for testing AI functionalities in a contained environment. [Not an active part of the DApp]
- `dapp.html`: A previous (initial) iteration of the DApp. [Not an active part of the DApp]
- `diagnostics.html`: Interface for diagnostics features.
- `favicon.ico`: Icon displayed in the browser tab.  
- `index.html`: Main entry point of the application.
- `login.html`: Interface for user login enforcement.
- `manifest.json`: Configuration file for web application manifest.
- `network.html`: Interface for network configurations. Focuses on creating and managing a network of resources.
- `notifications.html`: Interface for managing notifications.
- `service-worker.mjs`: Interface for managing background operations, interacting with physarai, and ensuring that the application remains functional and responsive even in offline conditions.
- `tasks.html`: Interface for task management. Focuses on managing tasks, particularly breaking down goals into actionable items.

##### JavaScript Directory (js/)
- **db/**: Contains database initialization scripts.
  - **data-specific/**:
    - `network-utils.js`: Utility functions for network-related operations.
    - `notification-utils.js`: Utility functions for handling notifications.
    - `task-utils.js`: Utility functions for task management.
  - `db-init-common.js`: Initializes common database configurations and setups.
  - `db-init-dapp-settings.js`: Initializes the DApp settings database.
  - `db-init-general-feedback.js`: Initializes the general feedback database.
  - `db-init-main-content-controls.js`: Initializes the main content controls database.
  - `db-init-menu.js`: Initializes the menu configurations in the database.
  - `db-init-network.js`: Initializes the network configurations database.
  - `db-init-network-feedback.js`: Initializes the network feedback database.
  - `db-init-notification-feedback.js`: Initializes the notification feedback database.
  - `db-init-notifications.js`: Initializes the notifications database.
  - `db-init-task-feedback.js`: Initializes the task feedback database.
  - `db-init-tasks.js`: Initializes the tasks database.
  - `db-init-users.js`: Initializes the users database.
  - `db-init.js`: General script to initialize the entire database setup.

- **ui/**: User interface related scripts.
  - `ui-ai-chat.js`: Manages AI chat interactions.
  - `ui-auth.js`: Handles user authentication.
  - `ui-color-extractor.js`: Extracts colors for UI themes.
  - `ui-controls.js`: Manages UI controls and interactions.
  - `ui-menu.js`: Manages UI menu navigation.

- **utils/**: Utility scripts.
  - `common.js`: Common utility functions used across the application.
  - `encryption.js`: Handles data encryption.
  - `logging.js`: Manages logging functionality.
  - `string-parse.js`: Parses and processes strings.

- **ai/**: Scripts related to PhysarAI.
  - **physarai/**:
    - `physarai-ai-conversations.js`: Manages AI conversations.
    - `physarai-config.js`: Configuration settings for PhysarAI.
    - `physarai-database.js`: Database interactions for PhysarAI.
    - `physarai-helpers.js`: Helper functions for PhysarAI.
    - `physarai-llm-interactions.js`: Manages large language model interactions.
    - `physarai-llm-schema.js`: Schema definitions for large language models.
    - `physarai-main.js`: Main script for PhysarAI functionalities.
  - `knowledge.js`: Manages knowledge base for AI.

- `dapp-config.js`: Configuration settings for the DApp.
- `dapp.js`: Main script for DApp functionalities.
- `diagnostics.js`: Handles diagnostics features.
- `network.js`: Manages network configurations.
- `notifications.js`: Manages notifications.
- `tasks.js`: Manages task functionalities.

##### Data Directory (data/)
- **substrates/**: Contains various data states and configurations.
  - **aging-in-place/**: 
    - `appliance_inventory.json`: JSON file containing appliance inventory data.
    - `background.jpg`: Background image used in aging-in-place interfaces.
    - `habit_tracking_feedback.json`: JSON file for storing feedback on habit tracking.
    - `habit_tracking_log.json`: JSON file for logging habit tracking data.
    - `incident_user_feedback.json`: JSON file for storing user feedback on incidents.
    - `incidents.json`: JSON file containing incident data.
    - `maintenance_recommendations_log.json`: JSON file for logging maintenance recommendations.
    - `maintenance_user_feedback.json`: JSON file for storing user feedback on maintenance activities.
  
  - **conference-productivity/**:
    - `background.jpg`: Background image used in conference productivity interfaces.
    - `dapp-connectons.json`: JSON file for storing DApp connections data.
    - `dapp-settings.json`: JSON file for storing settings related to the DApp.
    - `general-feedback.json`: JSON file for storing general feedback data.
    - `main-content-controls.json`: JSON file containing main content control settings.
    - `menu-options.json`: JSON file for storing menu options.
    - `network-feedback.json`: JSON file for storing feedback on network configurations.
    - `network.json`: JSON file for storing network configuration data.
    - `notification-feedback.json`: JSON file for storing feedback on notifications.
    - `notifications.json`: JSON file for storing notifications data.
    - `task-feedback.json`: JSON file for storing feedback on tasks.
    - `tasks.json`: JSON file containing task data.

  - **cybersecurity-productivity/**:
    - `dapp-settings.json`: JSON file for storing DApp settings related to cybersecurity productivity.
    - `general-feedback.json`: JSON file for storing general feedback.
    - `main-content-controls.json`: JSON file for storing main content control settings.
    - `menu-options.json`: JSON file for storing menu options.
    - `network-feedback.json`: JSON file for storing feedback on network configurations.
    - `network.json`: JSON file for storing network configurations.
    - `notification-feedback.json`: JSON file for storing feedback on notifications.
    - `notifications.json`: JSON file containing notifications data.
    - `task-feedback.json`: JSON file for storing feedback on tasks.
    - `tasks.json`: JSON file containing task data.

  - **substrate-data-templates/**: Example templates utilized to feed LLMs for generating seed substrate data.
    - `general-feedback.txt`: Template for collecting general feedback.
    - `network-and-feedback.txt`: Template for collecting network feedback.
    - `notifications-and-feedback.txt`: Template for collecting notifications feedback.
    - `tasks-and-feedback.txt`: Template for collecting tasks feedback.

##### CSS Directory (css/)
- **base/**: Contains base styling for the application.
  - `base.css`: Base stylesheet defining fundamental styles for the application.
  - `typography.css`: Stylesheet specifically for managing typography (fonts, headings, etc.).
  - `variables.css`: Stylesheet containing CSS variables used across other stylesheets.

- **components/**: Contains styles for various UI components.
  - `ai-chat-button.css`: Styles for AI chat button elements.
  - `ai-chat.css`: Styles for the AI chat interface.
  - `buttons.css`: Styles for button elements.
  - `cards.css`: Styles for card components.
  - `controls.css`: Styles for UI controls (forms, buttons, etc.).
  - `dapp-settings.css`: Styles for the DApp settings interface.
  - `main-content.css`: Styles for the main content area.
  - `menu.css`: Styles for navigation menus.
  - `sign-in.css`: Styles for the sign-in interface.

- **layout/**: Contains styles related to layout management.
  - `layout.css`: Stylesheet managing the layout structure of the application.

- **utils/**: Contains utility styles.
  - `responsive.css`: Stylesheet for managing responsive design, ensuring the application adapts to different screen sizes.

##### Libraries Directory (lib/)
- **bcrypt/**: Library for password hashing.
  - `bcrypt.min.js`: Minified JavaScript file for the bcrypt library, used for secure password hashing.

- **bootstrap/**: Bootstrap framework for responsive design.
  - **css/**: 
    - `bootstrap.min.css`: Minified CSS file for Bootstrap, providing responsive layout and component styles.
  - **js/**: 
    - `bootstrap.bundle.min.js`: Minified JavaScript bundle for Bootstrap, including necessary plugins like modals, tooltips, etc.

- **fontawesome/**: Font Awesome library for icons.
  - Contains font files and CSS for integrating Font Awesome icons into the application.

- **pouchdb/**: PouchDB library for client-side database management.
  - `pouchdb.min.js`: Minified JavaScript file for PouchDB, enabling client-side database management and syncing with CouchDB.

- **vibrant/**: Vibrant library for color extraction from images.
  - `vibrant.min.js`: Minified JavaScript file for the Vibrant library, used to extract dominant colors from images for dynamic theming.

##### Documentation Directory (docs/)
- Contains documentation files.

##### Fonts Directory (fonts/)
- Contains font files used in the application.

##### Images Directory (images/)
- Contains image files used in the application.


## Development Guide

## Advanced Topics

## FAQ and Troubleshooting

## Contribution Guide

##### How to Contribute
- **Forking the Repository**: Fork the repository on GitHub and clone it to your local machine.
- **Creating Branches**: Create a new branch for your feature or bug fix.
- **Making Changes**: Implement your changes, following the coding standards below.
- **Committing Changes**: Write clear and concise commit messages (e.g., “Add feature: Implement AI chat interface”).

##### Coding Standards and Guidelines

This section outlines the coding standards and best practices to be followed when contributing to the codebase. The standards are designed to ensure consistency, readability, maintainability, and scalability of the code.

1. **HTML Structure and Best Practices**
- **External Libraries and Styles**: Load external libraries and stylesheets at the top of the `<head>` section. Ensure that all dependencies are documented and version-controlled.
- **Custom CSS and Scripts**: Custom CSS and JavaScript files should be linked after external libraries. Follow a clear directory structure (e.g., `/css/`, `/js/`, `/lib/`).
- **Accessibility**: Use semantic HTML elements like `<nav>`, `<header>`, `<footer>`, `<section>`, and `<article>` to improve accessibility. Always include `aria-labels` and titles where applicable for assistive technologies.

2. **JavaScript Standards**
- **Modular Code**: Use ES6 modules (`import` and `export`) to organize code into logical, reusable components. This promotes maintainability and separation of concerns.
- **Error Handling**: Always include error handling (`try-catch`) for asynchronous operations like database access or network requests. Log errors to the console with descriptive messages.
- **Database Operations**: Use PouchDB for local storage and data management. Ensure that database initialization occurs before any UI operations. Fetch and render data efficiently, utilizing asynchronous functions (`async-await`).
- **Function Documentation**: Each function should be documented with comments explaining its purpose, parameters, and return values. Use clear and descriptive names for functions and variables.

3. **CSS and Styling Guidelines**
- **Naming Conventions**: Follow a consistent naming convention for classes, such as `kebab-case` (e.g., `.ai-chat-button`, `.card-container`). Ensure that class names are descriptive and relevant to their function.
- **Responsive Design**: Use media queries and Bootstrap classes (`d-flex`, `vh-100`, etc.) to create responsive layouts. Test the UI across various devices to ensure compatibility.
- **Variables and Reusability**: Use CSS variables (`:root { --primary-color: #333; }`) for colors, fonts, and other reusable values. This promotes consistency and makes it easier to update styles globally.

4. **Security Considerations**
- **Data Encryption**: Use bcrypt or similar libraries for sensitive data encryption. Always encrypt/decrypt data before storing/retrieving from databases.
- **Input Validation**: Validate all user inputs to prevent security vulnerabilities such as SQL injection or XSS attacks. Sanitize data before processing.
- **Permissions and Notifications**: Always check and request user permissions for notifications. Provide clear instructions and fallback mechanisms if the browser does not support certain APIs.

5. **Testing and Debugging**
- **Console Logs**: Use `console.log` for debugging during development, but remove or comment out unnecessary logs in the production code. Use a logging utility if consistent and detailed logging is required.
- **Browser Compatibility**: Test the application in multiple browsers to ensure consistent behavior. Address any browser-specific issues promptly.

6. **Documentation and Comments**
- **Code Comments**: Use one-line comments whenever possible, placed on lines by themselves. Comment all code, and ensure each major block of code explains its intent. The reader should understand the intent of the code just by reading the comments.
- **Documentation**: Maintain up-to-date documentation for the project, including setup instructions, usage guidelines, and development notes. Keep the documentation in the `docs` directory and update it as the project evolves.

By following these coding standards, we ensure that our codebase remains clean, efficient, and easy to maintain. Consistency in coding practices across the team will lead to a more robust and scalable product.

##### Pull Request Process
- **Submitting a Pull Request**: Push your branch to GitHub and open a pull request.
- **Review Process**: Your pull request will be reviewed by project maintainers. Make necessary changes based on feedback.
- **Merging**: Once approved, your changes will be merged into the main branch.

## Appendix

##### Glossary
- **AI**: Artificial Intelligence
- **DApp**: Decentralized Application
- **Service Worker**: A script that runs in the background and handles caching and other network related operations for offline capabilities
- **API**: Application Programming Interface  

##### Additional Resources
- **Official Documentation**:
  - Bootstrap:
    - https://getbootstrap.com/docs/4.5/getting-started/introduction/
    - https://getbootstrap.com/docs/5.1/getting-started/introduction/

  - PouchDB - https://pouchdb.com/guides/

- **Tutorials and Guides**: Recommended tutorials for further learning.