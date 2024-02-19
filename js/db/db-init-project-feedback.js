import { putData, fetchJSONData } from './db-init-common.js';

async function initializeProjectFeedback(db) {
  // Fetch the JSON data and await its resolution to ensure content is an array
  const projectFeedbackData = await fetchJSONData('./data/project-feedback.json');

  // Put the retreived menu data into the database
  await putData(db, projectFeedbackData);
}

export { initializeProjectFeedback };