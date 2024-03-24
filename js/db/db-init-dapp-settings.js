import { putData, fetchJSONData } from './db-init-common.js';

async function initializeDappSettings(db) {
  // Fetch the JSON data and await its resolution to ensure data is an array
  const dappSettingsData = await fetchJSONData('./data/dapp-settings.json');

  // Put the retreived menu data into the database
  await putData(db, dappSettingsData);
}

export { initializeDappSettings };