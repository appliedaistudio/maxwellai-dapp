import { putData, fetchJSONData } from './db-init-common.js';
import config from '../dapp-config.js';

async function initializeTaskFeedback(db) {
  // Fetch the JSON data and await its resolution to ensure content is an array
  const taskFeedbackData = await fetchJSONData(`./data/substrates/${config.substrateFolder}/task-feedback.json`);

  // Put the retreived menu data into the database
  await putData(db, taskFeedbackData);
}

export { initializeTaskFeedback };