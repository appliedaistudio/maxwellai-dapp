import { putData, fetchJSONData } from './db-init-common.js';
import config from '../dapp-config.js';

async function initializeNotificationFeedback(db) {
  // Fetch the JSON data and await its resolution
  const notificationFeedbackData = await fetchJSONData(`./data/substrates/${config.substrateFolder}/notification-feedback.json`);

  // Put the retreived menu data into the database
  await putData(db, notificationFeedbackData);
}

export { initializeNotificationFeedback };