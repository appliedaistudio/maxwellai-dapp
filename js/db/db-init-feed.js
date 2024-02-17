import { putData, fetchJSONData } from './db-init-common.js';

async function initializeFeed(db) {
  // Fetch the JSON data and await its resolution to ensure contentControls is an array
  const feedData = await fetchJSONData('./data/feed.json');

  // Put the retreived menu data into the database
  await putData(db, feedData);
}

export { initializeFeed };