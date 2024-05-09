import { putData, fetchJSONData } from './db-init-common.js';

async function initializeNetworkFeedback(db) {
  // Fetch the JSON data and await its resolution
  const networkFeedbackData = await fetchJSONData('./data/network-feedback.json');

  // Put the retreived data into the database
  await putData(db, networkFeedbackData);
}

export { initializeNetworkFeedback };