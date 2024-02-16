// A common function to put data into the database, overwriting existing data if necessary
async function putData(db, data) {
  try {
    // First, try to retrieve the existing document (if it exists)
    const existingDoc = await db.get(data._id).catch(error => {
      if (error.name === 'not_found') {
        return null; // The document is not in DB which is fine, we'll create a new one
      } else {
        throw error; // Propagate other errors so they can be caught later
      }
    });

    // If the document exists, use its revision id (`_rev`) to overwrite it
    if (existingDoc) {
      data._rev = existingDoc._rev;
    }

    // Put the (possibly updated) document into the DB
    const result = await db.put(data);
    return result;
  } catch (error) {
    console.error(`Error in putData function: ${error.message}`, data);
    throw error;
  }
}

// Function to fetch JSON data from server
async function fetchJSONData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}
  
export { putData, fetchJSONData };