import config from '../dapp-config.js';

// Initialize document ID
const docId = 'maxwell_ai_tasks';

// Initialize PouchlocalDb instance with the specified database name
const localDb = new PouchlocalDb(localDbName);

// Function to create a new task
async function createTask(task) {
    try {
        // Insert the new task document into the database
        const response = await localDb.post(task);
        return response;
    } catch (error) {
        throw error;
    }
}

// Function to get all tasks
async function getAllTasks() {
    try {
        // Retrieve the document containing tasks from the database
        const response = await localDb.get(docId);
        // Return the tasks array from the retrieved document
        return response.tasks;
    } catch (error) {
        throw error;
    }
}

// Function to get a task by ID
async function getTaskById(id) {
    try {
        // Retrieve the document containing tasks from the database
        const response = await localDb.get(docId);
        // Find the task with the specified ID from the tasks array in the document
        const task = response.tasks.find(task => task._id === id);
        if (task) {
            return task;
        } else {
            throw new Error('Task not found');
        }
    } catch (error) {
        throw error;
    }
}

// Function to update a task
async function updateTask(task) {
    try {
        // Retrieve the document containing tasks from the database
        const response = await localDb.get(docId);
        // Find the index of the task to be updated in the tasks array
        const index = response.tasks.findIndex(t => t._id === task._id);
        if (index !== -1) {
            // Update the task in the tasks array
            response.tasks[index] = task;
            // Save the updated document back to the database
            await localDb.put(response);
            return { updated: true };
        } else {
            throw new Error('Task not found');
        }
    } catch (error) {
        throw error;
    }
}

// Function to delete a task
async function deleteTask(id) {
    try {
        // Retrieve the document containing tasks from the database
        const response = await localDb.get(docId);
        // Find the index of the task to be deleted in the tasks array
        const index = response.tasks.findIndex(task => task._id === id);
        if (index !== -1) {
            // Remove the task from the tasks array
            response.tasks.splice(index, 1);
            // Save the updated document back to the database
            await localDb.put(response);
            return { deleted: true };
        } else {
            throw new Error('Task not found');
        }
    } catch (error) {
        throw error;
    }
}

// Export CRUD functions
export {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
};
