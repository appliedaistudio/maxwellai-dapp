// Configuration details for PouchDB and CouchDB
const config = {
    remoteDbBase: 'example.com/my_remote_database',
    remoteDbUsername: 'your_couchdb_username',
    remoteDbPassword: 'your_couchdb_password',
    applicationSessionId: 'current_session',
    localDbName: 'my_local_database', // Name of your local PouchDB
    backgroundImage: './data/substrates/conference-productivity/background.jpg',
    homePage: './index.html',
    notificationCheckInterval: 360000, // X miliseconds
    verbosityLevel: 2,
    encryptionPassword: 'maxwellai',
    substrateFolder: "conference-productivity",
};

// Function to set the CSS variable for background image
function setBackgroundImageVariable() {
    // Check if document is defined (i.e., not called from a service worker)
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--background-image', `url('../../data/substrates/${config.substrateFolder}/background.jpg')`);
    }
}

// Call the function to set the background image variable
setBackgroundImageVariable();

export default config;