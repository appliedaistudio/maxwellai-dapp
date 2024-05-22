import { putData, fetchJSONData } from './db-init-common.js';
import { aiConfig } from '../../js/ai/physarai/physarai-config.js'

async function initializeNetworkFeedback(db) {
  // Fetch the JSON data and await its resolution
  const networkFeedbackData = await fetchJSONData(`./data/substrates/${aiConfig.aiSubstrateFolder}/network-feedback.json`);

  // Put the retreived data into the database
  await putData(db, networkFeedbackData);
}

export { initializeNetworkFeedback };