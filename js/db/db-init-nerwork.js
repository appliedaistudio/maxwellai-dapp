import { putData, fetchJSONData } from './db-init-common.js';
import { aiConfig } from '../../js/ai/physarai/physarai-config.js'

async function initializeNetwork(db) {
  // Fetch the JSON data and await its resolution
  const networkData = await fetchJSONData(`./data/substrates/${aiConfig.aiSubstrateFolder}/network.json`);

  // Put the retreived data into the database
  await putData(db, networkData);
}

export { initializeNetwork };