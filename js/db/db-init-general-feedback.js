import { putData, fetchJSONData } from './db-init-common.js';
import { aiConfig } from '../ai/physarai/physarai-config.js'

async function initializeGeneralFeedback(db) {
  // Fetch the JSON data and await its resolution to ensure content is an array
  const projectFeedbackData = await fetchJSONData(`./data/substrates/${aiConfig.aiSubstrateFolder}/general-feedback.json`);

  // Put the retreived menu data into the database
  await putData(db, projectFeedbackData);
}

export { initializeGeneralFeedback };