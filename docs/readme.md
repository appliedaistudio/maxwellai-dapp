
**Purpose**: Provide an overview and essential information to get started with the project. 

**Contents**: 
- `Introduction`: Title and Description
- `Getting Started`: Prerequisites, Installing and Running the project
- `Quick Usage Guide`: (Coming Soon)
- `Project Structure`: System Design and Architecture
- `Development Guide`: (Coming Soon)
- `Advanced Topics`: (Coming Soon)
- `FAQ and Troubleshooting`: (Coming Soon)
- `Contribution Guide`: (Coming Soon)
- `Appendix`

# PhysarAI DApp

PhysarAI DApp is a decentralized web application integrating AI functionalities. It is designed to run in a web browser with offline capabilities, allowing users to interact with our state of the art Artificial Intelligence program featuring a completely decentralized infrastructure that runs seamlessly on the client machine.

### Getting Started

##### Prerequisites
- A local web server setup (e.g., Python's HTTP server)
- Basic knowledge of HTML, CSS, and JavaScript

##### Installation

Clone the repository and navigate to project folder:

   ```bash
   git clone https://github.com/appliedaistudio/maxwellai-dapp.git
   cd maxwellai-dapp
```

##### Running the Project

1. Start the local web server:
   ```bash
   python3 -m http.server
   ```
2. Open your browser and go to `http://localhost:8000`.


### Quick Usage Guide


### Project Structure

##### System Design

The PhysarAI DApp is structured to separate concerns across different directories and files. The root directory contains the main HTML files for the user interface. The `js` directory is divided into subdirectories for database operations, UI components, and utility functions. Libraries such as Bootstrap and PouchDB are stored in the `lib` directory. Data states and templates are organized under the `data` directory.

Each component interacts through defined interfaces and APIs, ensuring modularity and ease of maintenance. The service worker enhances the application by enabling offline capabilities and efficient caching.

##### System Architecture

###### Diagram

![System Architecture Diagram](path/to/diagram.png)


##### Directory and File Breakdown

###### Root Directory
- `aiTest.html`: Interface for testing AI functionalities in a contained environment.
- `dapp.html`: Interface for DApp interactions.  
- `diagnostics.html`: Interface for diagnostics features.
- `favicon.ico`: Icon displayed in the browser tab.  
- `index.html`: Main entry point of the application.
- `login.html`: Interface for user login.
- `manifest.json`: Configuration file for web application manifest.
- `network.html`: Interface for network configurations.
- `notifications.html`: Interface for managing notifications.
- `service-worker.mjs`: Service worker script for offline capabilities and caching.
- `tasks.html`: Interface for task management.

###### JavaScript Directory (js/)
  - `db/`: Contains database initialization scripts.
  - `ui/`: User interface related scripts.
  - `utils/`: Utility scripts.
  - `ai/`: Scripts related to PhysarAI.

###### Libraries Directory (lib/)
  - `bcrypt/`: Library for password hashing.
  - `bootstrap/`: Bootstrap framework for responsive design.
  - `fontawesome/`: Font Awesome library for icons.
  - `pouchdb/`: PouchDB library for client-side database management.
  - `vibrant/`: Vibrant library for color extraction from images.

###### Data Directory (data/)
  - `substates/`: Contains various data states and configurations.
  - `prompt-templates/`: Templates for different prompts.

###### Documentation Directory (docs/)
  - Contains documentation files.

###### Fonts Directory (fonts/)
  - Contains font files used in the application.

###### mages Directory (images/)
  - Contains image files used in the application.


### Development Guide

### Advanced Topics

### FAQ and Troubleshooting

### Contribution Guide

### Appendix
