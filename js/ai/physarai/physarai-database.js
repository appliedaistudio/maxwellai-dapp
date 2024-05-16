import '../../../lib/pouchdb/pouchdb.min.js';
import config from '../../dapp-config.js';
import { decryptString } from '../../utils/encryption.js';

// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Define a function to fetch the LLM API key
async function llmApiKey() {

    // Retrieve the 'dapp_settings' document from the local database synchronously
    const settingsDoc = await localDb.get('dapp_settings');
    
    // Access and decrypt the LLM API key from the settings object
    const decryptedApiKey = await decryptString(settingsDoc.settings.LLM_api_key);
    return decryptedApiKey;
}

// Define a function to fetch the LLM end point
async function llmEndpoint() {

    // Retrieve the 'dapp_settings' document from the local database synchronously
    const settingsDoc = await localDb.get('dapp_settings');
    
    // Access and decrypt the LLM endpoint from the settings object
    const decryptedLlmEndpoint = await decryptString(settingsDoc.settings.LLM_endpoint);
    return decryptedLlmEndpoint;
}

export { llmApiKey, llmEndpoint };
