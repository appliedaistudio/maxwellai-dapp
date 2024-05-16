import config from "../../dapp-config.js";
import aiConfig from "../../ai/physarai/physarai-config.js";
import { validateJson } from "../../utils/string-parse.js";
import { log } from "../../utils/logging.js";

// Define a JSON schema for tasks
const taskSchema = `
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Task",
        "type": "object",
        "properties": {
            "_id": {
                "type": "string"
            },
            "category": {
                "type": "string",
                "enum": ["Research", "Presentation Preparation", "Documentation", "Skill Development"]
            },
            "priority": {
                "type": "string",
                "enum": ["High", "Medium", "Low"]
            },
            "date_identified": {
                "type": "string",
                "format": "date"
            },
            "date_and_time_start": {
                "type": "string",
                "format": "date-time"
            },
            "target_date_and_time_completion": {
                "type": "string",
                "format": "date-time"
            },
            "status": {
                "type": "string",
                "enum": ["Not Started", "In Progress", "Completed", "Deferred"]
            },
            "description": {
                "type": "string"
            }
        },
        "required": ["_id", "category", "priority", "date_identified", "date_and_time_start", "target_date_and_time_completion", "status", "description"]
    }`;

// Initialize document ID
const docId = 'maxwell_ai_tasks';

// Initialize PouchlocalDb instance with the specified database name
const localDb = new PouchDB(config.localDbName);

// Function to validate task against JSON schema
function validateTask(taskString) {
    try {
        const task = JSON.parse(taskString);
        const validationResult = validateJson(task, taskSchema);
        // Return validation result
        if (validationResult.valid) {
            return "Task schema validation successful.";
        } else {
            return "Task schema validation failed: " + validationResult.error;
        }
    } catch (error) {
        return "Error parsing JSON: " + error.message;
    }
};

// Function to create a new task
async function createTask(taskString) {
    console.log("inside create task input string " + taskString);

    try {
        // Validate task schema
        const validationOutcome = validateTask(taskString);

        // Parse task string into JSON
        const taskJson = JSON.parse(taskString);

        if (validationOutcome.includes("successful")) {
            // Get existing tasks from the database
            const existingTasks = await localDb.get(docId);
            // Append new task to existing tasks
            existingTasks.tasks.push(taskJson);
            // Update tasks document in the database
            const response = await localDb.put(existingTasks);

            return "Task created successfully.";
        } else {
            return validationOutcome; // Return validation failure message
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, 'createTask');
        return "Error creating task: " + error.message;
    }
}

// Function to retrieve all tasks
async function getAllTasks() {
    try {
        const response = await localDb.get(docId);
        return JSON.stringify(response.tasks);
    } catch (error) {
        log(error, config.verbosityLevel, 1, 'getAllTasks');
        return "Error retrieving tasks: " + error.message;
    }
}

// Function to retrieve a task by ID
function getTaskById(id) {
    try {
        return localDb.get(docId)
            .then(response => {
                const task = response.tasks.find(task => task._id === id);
                if (task) {
                    return task;
                } else {
                    return "Task not found";
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 1, 'getTaskById');
        return "Error retrieving task by ID: " + error.message;
    }
}

// Function to update a task
function updateTask(taskString) {
    try {
        // Validate task schema
        const validationOutcome = validateTask(taskString);
        // Parse task string into JSON
        const taskJson = JSON.parse(taskString);

        if (validationOutcome.includes("successful")) {
            // Retrieve tasks document from the database
            return localDb.get(docId)
                .then(response => {
                    // Find task index by ID
                    const index = response.tasks.findIndex(t => t._id === taskJson._id);
                    if (index !== -1) {
                        // Update task in tasks array
                        response.tasks[index] = taskJson;
                        // Save updated tasks document to the database
                        return localDb.put(response)
                            .then(() => {
                                return "Task updated successfully.";
                            });
                    } else {
                        return "Task not found.";
                    }
                });
        } else {
            return validationOutcome; // Return validation failure message
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, 'updateTask');
        return "Error updating task: " + error.message;
    }
}

// Function to delete a task
function deleteTask(id) {
    try {
        // Retrieve tasks document from the database
        return localDb.get(docId)
            .then(response => {
                // Find task index by ID
                const index = response.tasks.findIndex(task => task._id === id);
                if (index !== -1) {
                    // Remove task from tasks array
                    response.tasks.splice(index, 1);
                    // Save updated tasks document to the database
                    return localDb.put(response)
                        .then(() => {
                            return "Task deleted successfully.";
                        });
                } else {
                    return "Task not found.";
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 1, 'deleteTask');
        return "Error deleting task: " + error.message;
    }
}

const taskTools = [
    {
        name: "Task JSON Schema Validation",
        func: validateTask,
        description: `Validates task data against a JSON schema to ensure conformity before performing CRUD operations. Requires a task object as input. The task object must be valid JSON that adheres to the specified ${taskSchema} schema.`
    },
    {
        name: "Create Task",
        func: createTask,
        description: `Creates a new task, validates its schema, and inserts it into the database. Requires, as input, an object representing a single task. The task object must be valid JSON that adheres to the specified ${taskSchema} schema.`
    },
    {
        name: "Retrieve All Tasks",
        func: getAllTasks,
        description: "Retrieves all existing tasks from the database and returns them as an array. No input required."
    },
    {
        name: "Retrieve Task by ID",
        func: getTaskById,
        description: "Retrieves a specific task from the database based on its ID. Requires the ID of the task as input."
    },
    {
        name: "Update Task",
        func: updateTask,
        description: `Updates an existing task, validates its schema, and saves the updated data back to the database. Requires a task object with an existing task ID and the updated data as input. The task object must be valid JSON that adheres to the specified ${taskSchema} schema.`
    },
    {
        name: "Delete Task",
        func: deleteTask,
        description: "Deletes a task from the database based on its ID. Requires the ID of the task to be deleted as input."
    }
];

const updateTasksPrompt = aiConfig.aiUpdateTasks;


// Export CRUD functions for tasks
export {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    taskTools,
    updateTasksPrompt
};
