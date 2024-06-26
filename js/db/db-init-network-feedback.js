import { putData, fetchJSONData } from './db-init-common.js';
import config from '../dapp-config.js';

async function initializeNetworkFeedback(db) {
  // Fetch the JSON data and await its resolution
  const networkFeedbackData = await fetchJSONData(`./data/substrates/${config.substrateFolder}/network-feedback.json`);

  // Put the retreived data into the database
  await putData(db, networkFeedbackData);
}

export { initializeNetworkFeedback };