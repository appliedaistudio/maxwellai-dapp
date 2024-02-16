// Configuration details for PouchDB and CouchDB
const config = {
    remoteDbBase: 'example.com/my_remote_database',
    remoteDbUsername: 'your_couchdb_username',
    remoteDbPassword: 'your_couchdb_password',
    localDbName: 'my_local_database', // Name of your local PouchDB
    backgroundImage: './images/background.jpg',
    homePage: './index.html',
    notificationCheckInterval: 360000, // X miliseconds
};

export default config;