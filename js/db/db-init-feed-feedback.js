import { putData, fetchJSONData } from './db-init-common.js';

async function initializeFeedFeedback(db) {
  // Fetch the JSON data and await its resolution to ensure content is an array
  const feedFeedbackData = await fetchJSONData('./data/feed-feedback.json');

  // Put the retreived menu data into the database
  await putData(db, feedFeedbackData);
}

export { initializeFeedFeedback };