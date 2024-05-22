import { putData, fetchJSONData } from './db-init-common.js';
import { aiConfig } from '../../js/ai/physarai/physarai-config.js'

async function initializeNotifications(db) {
  // Fetch the JSON data and await its resolution to ensure contentControls is an array
  const notificationsData = await fetchJSONData(`./data/substrates/${aiConfig.aiSubstrateFolder}/notifications.json`);

  // Put the retreived menu data into the database
  await putData(db, notificationsData);
}

export { initializeNotifications };