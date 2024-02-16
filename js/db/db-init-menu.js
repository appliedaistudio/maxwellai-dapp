import { putData, fetchJSONData } from './db-init-common.js';

async function initializeMenu(db) {
  // Fetch the JSON data and await its resolution to ensure contentControls is an array
  const menuData = await fetchJSONData('./data/menu-options.json');

  // Put the retreived menu data into the database
  await putData(db, menuData);
}

export { initializeMenu };