import config from "../../dapp-config.js";
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
            },
            "dependent_tasks": {
                "type": "array",
                "items": { "type": "integer" }
            }
        },
        "required": ["_id", "category", "priority", "date_identified", "date_and_time_start", "target_date_and_time_completion", "status", "description", "dependent_tasks"]
    }`;

// Initialize document ID
const docId = 'maxwell_ai_tasks';

// Initialize PouchlocalDb instance with the specified database name
const localDb = new PouchDB(config.localDbName);

// Function to validate task against JSON schema
function validateTask(task) {
    const validationResult = validateJson(task, taskSchema);
    if (!validationResult.valid) {
        throw new Error('Task schema validation failed: ' + validationResult.error);
    }
}

// Function to create a new task
async function createTask(taskString) {
    try {
        const taskJson = JSON.parse(taskString);
        validateTask(taskJson);

        const existingTasks = await localDb.get(docId);
        existingTasks.tasks.push(taskJson);
        const response = await localDb.put(existingTasks);

        return response;
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'createTask');
    }
}

// Function to retrieve all tasks
async function getAllTasks() {
    try {
        const response = await localDb.get(docId);
        return JSON.stringify(response.tasks);
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'getAllTasks');
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
                    throw new Error('Task not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'getTaskById');
    }
}

// Function to update a task
function updateTask(taskString) {
    try {
        const taskJson = JSON.parse(taskString);
        validateTask(taskJson);

        return localDb.get(docId)
            .then(response => {
                const index = response.tasks.findIndex(t => t._id === taskJson._id);
                if (index !== -1) {
                    response.tasks[index] = taskJson;
                    return localDb.put(response)
                        .then(() => {
                            return { updated: true };
                        });
                } else {
                    throw new Error('Task not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'updateTask');
    }
}

// Function to delete a task
function deleteTask(id) {
    try {
        return localDb.get(docId)
            .then(response => {
                const index = response.tasks.findIndex(task => task._id === id);
                if (index !== -1) {
                    response.tasks.splice(index, 1);
                    return localDb.put(response)
                        .then(() => {
                            return { deleted: true };
                        });
                } else {
                    throw new Error('Task not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'deleteTask');
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

const updateTasksPrompt = `
    Refine tasks based on user interactions:
    1. Get a list of the existing tasks
    2. Review task priorities and take the initaitve to adjust them based on your analysis of changing project requirements.
    3. Ensure tasks are categorized effectively for better organization and tracking.
    4. Revise task descriptions to provide clearer instructions or include additional details as needed.
    5. Update task statuses to reflect progress accurately, marking completed tasks and adjusting those in progress.
    6. Identify and address dependencies between tasks, updating dependent tasks accordingly.
    7. It's advisable to regularly review and update task deadlines to align with project timelines and goals.
    8. Consider introducing new tasks or merging existing ones to streamline workflows and improve efficiency.
    9. Take user feedback and project insights into account when updating tasks to enhance project management processes.`;


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
