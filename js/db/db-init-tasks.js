import { putData, fetchJSONData } from './db-init-common.js';

async function initializeTasks(db) {
  // Fetch the JSON data and await its resolution to ensure contentControls is an array
  const tasksData = await fetchJSONData('./data/tasks.json');

  // Put the retreived menu data into the database
  await putData(db, tasksData);
}

export { initializeTasks };