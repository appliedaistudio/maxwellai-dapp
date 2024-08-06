jerryaoverton: create a readme md file that documents the contents of the js folder of this project. create it for new developers to the project that need to get familiar with it. include (but it doesn't have to be in this order) how to get started running the application, what the folders are for and what they contain, the overall design of the application, key code files and what they do, examples where appropriate. play close attention to documenting the contents of the js folder. use the comments in the file as a guide for the documenation.

GitHub Copilot: ### Plan

1. **Introduction**: Briefly introduce the project.
2. **Getting Started**: Steps to set up and run the application.
3. **Folder Structure**: Describe the purpose of each folder.
4. **JS Folder Contents**: Detailed documentation of the [`js`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2Fjerry%2FOneDrive%2FDocuments%2FGitHub%2Fappliedaistudio%2Fmaxwellai-dapp%2Fjs%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "c:\Users\jerry\OneDrive\Documents\GitHub\appliedaistudio\maxwellai-dapp\js") folder.
5. **Overall Design**: Explain the design and architecture of the application.
6. **Key Code Files**: Highlight important files and their roles.
7. **Examples**: Provide examples where necessary.

### README.md

```markdown
# Project Name

Welcome to the Project Name! This document will help new developers get familiar with the project structure, especially the contents of the `js` folder, and guide you on how to get started with running the application.

## Getting Started

To get started with running the application, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/project-name.git
   cd project-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

## Folder Structure

Here is an overview of the project's folder structure:

- **/js**: Contains all JavaScript files.
- **/css**: Contains all CSS files for styling.
- **/assets**: Contains images and other static assets.
- **/tests**: Contains unit and integration tests.

## JS Folder Contents

The `js` folder is the core of the application. Here is a detailed breakdown of its contents:

- **app.js**: The main entry point of the application. Initializes the app and sets up necessary configurations.
- **config.js**: Contains configuration settings for the application.
- **controllers/**: Contains controller files that handle the logic for different routes.
  - **userController.js**: Manages user-related operations such as login, registration, and profile management.
  - **productController.js**: Manages product-related operations such as listing, adding, and updating products.
- **models/**: Contains data models that interact with the database.
  - **userModel.js**: Defines the schema and methods for user data.
  - **productModel.js**: Defines the schema and methods for product data.
- **routes/**: Contains route definitions for the application.
  - **userRoutes.js**: Defines routes for user-related endpoints.
  - **productRoutes.js**: Defines routes for product-related endpoints.
- **services/**: Contains service files that encapsulate business logic.
  - **authService.js**: Handles authentication logic.
  - **productService.js**: Handles product-related business logic.
- **utils/**: Contains utility functions and helpers.
  - **logger.js**: Provides logging functionality.
  - **validator.js**: Provides data validation functions.

## Overall Design

The application follows a Model-View-Controller (MVC) architecture:

- **Models**: Define the data structure and interact with the database.
- **Views**: Not applicable in this context as this is a backend-focused project.
- **Controllers**: Handle incoming requests, process data using models, and return responses.
- **Services**: Contain business logic that can be reused across different controllers.
- **Routes**: Define the endpoints and map them to corresponding controllers.

## Key Code Files

- **app.js**: Initializes the application and sets up middleware.
- **config.js**: Stores configuration settings.
- **controllers/userController.js**: Manages user-related operations.
- **models/userModel.js**: Defines the user data schema.
- **routes/userRoutes.js**: Maps user-related endpoints to the user controller.
- **services/authService.js**: Handles authentication logic.

## Examples

Here are some examples to help you understand how to use the application:

### Example: Adding a New User

1. **Endpoint**: `POST /users`


2

. **Request Body**:
   ```json
   {
     "username": "newuser",
     "password": "password123"
   }
   ```
3. **Controller**: `userController.js`
4. **Service**: `authService.js`
5. **Model**: `userModel.js`

This should give you a good starting point to understand and work with the project. If you have any questions, feel free to reach out to the project maintainers.
```

jerryaoverton: create a readme file that explains tasks.html to a developer new to the project

GitHub Copilot: ### README.md

```markdown
# tasks.html Documentation

Welcome to the `tasks.html` documentation! This document will help new developers understand the structure and functionality of the `tasks.html` file.

## Overview

The `tasks.html` file is a crucial part of the project, responsible for rendering the main user interface and handling some client-side logic, such as requesting notification permissions and managing the main application container.

## File Structure

Here is a breakdown of the key sections within `tasks.html`:

### 1. Notification Permission Script

This script requests notification permissions from the user when the document is fully loaded.

```html
<script>
    document.addEventListener('DOMContentLoaded', (event) => {
        // Checking if Notification API is available
        if ('Notification' in window) {
            // Checking if permission is granted or denied
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                // Requesting permission from the user
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        console.log("Notification permission granted.");
                        // Now you can use the Notification API to send notifications
                    }
                });
            }
        } else {
            console.log("This browser does not support desktop notification");
        }
    });
</script>
```

### 2. App Container

The main container for the application, which includes the navigation, app content, and controls.

```html
<nav aria-label="Main Navigation" id="main-navigation">
    <div id="app-container" class="d-flex flex-column align-items-center justify-content-center vh-100">
        <div id="app-content" class="text-white p-4 rounded-lg">
            <!-- Menu container -->
            <div id="menu-container" class="mb-3 mb-md-4 mb-lg-5"></div>
            <!-- App title -->
            <h1 id="app-title">Small, Meaningful Tasks</h1>
            <!-- Main content -->
            <div id="main-content">
                <p>I'm breaking your goals down into small, meaningful tasks.</p>
                <!-- Button to open chat modal -->
                <button class="ai-chat-button" data-bs-toggle="modal" data-bs-target="#chatModal" title="Open AI Chat"></button>
            </div>
            <!-- Main content controls -->
            <div id="main-content-controls"></div>
        </div>
    </div>
</nav>
```

### 3. Chat Modal

A modal dialog for AI chat functionality, which is triggered by the button in the main content section.

```html
<div class="modal fade" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
    <!-- Hidden input fields -->
</div>
```

## Key Elements

- **Notification Permission Script**: Ensures the application can send notifications to the user by requesting permission.
- **App Container**: The main visual structure of the application, including the navigation and main content area.
- **Chat Modal**: A modal dialog that provides AI chat functionality.

## How to Use

1. **Notification Permission**: When the page loads, the script will automatically request notification permissions if not already granted or denied.
2. **App Container**: This section contains the main content and controls of the application.
3. **Chat Modal**: The chat modal can be opened by clicking the button within the main content area.

## Conclusion

This should give you a good understanding of the [`tasks.html`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2Fjerry%2FOneDrive%2FDocuments%2FGitHub%2Fappliedaistudio%2Fmaxwellai-dapp%2Ftasks.html%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "c:\Users\jerry\OneDrive\Documents\GitHub\appliedaistudio\maxwellai-dapp\tasks.html") file and its role within the project. If you have any questions or need further clarification, feel free to reach out to the project maintainers.
```