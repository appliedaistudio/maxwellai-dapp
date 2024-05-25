import { putData, fetchJSONData } from './db-init-common.js';
import config from '../dapp-config.js';

async function initializeNetwork(db) {
  // Fetch the JSON data and await its resolution
  const networkData = await fetchJSONData(`./data/substrates/${config.substrateFolder}/network.json`);

  // Put the retreived data into the database
  await putData(db, networkData);
}

export { initializeNetwork };