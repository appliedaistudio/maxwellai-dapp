import { putData, fetchJSONData } from './db-init-common.js';
import config from '../dapp-config.js';

async function initializeTasks(db) {
  // Fetch the JSON data and await its resolution
  const tasksData = await fetchJSONData(`./data/substrates/${config.substrateFolder}/tasks.json`);

  // Put the retreived data into the database
  await putData(db, tasksData);
}

export { initializeTasks };