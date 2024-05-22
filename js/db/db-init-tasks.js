import { putData, fetchJSONData } from './db-init-common.js';
import { aiConfig } from '../../js/ai/physarai/physarai-config.js'

async function initializeTasks(db) {
  // Fetch the JSON data and await its resolution
  const tasksData = await fetchJSONData(`./data/substrates/${aiConfig.aiSubstrateFolder}/tasks.json`);

  // Put the retreived data into the database
  await putData(db, tasksData);
}

export { initializeTasks };