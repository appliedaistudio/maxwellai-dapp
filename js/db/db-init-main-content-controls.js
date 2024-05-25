import { putData, fetchJSONData } from './db-init-common.js';
import config from '../dapp-config.js';

async function initializeMainContent(db) {
  // Fetch the JSON data and await its resolution to ensure contentControls is an array
  const contentData = await fetchJSONData(`./data/substrates/${config.substrateFolder}/main-content-controls.json`);

  // Put the retreived menu data into the database
  await putData(db, contentData);
}

export { initializeMainContent };