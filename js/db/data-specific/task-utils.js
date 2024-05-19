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

// Define a JSON schema for a list of tasks
const listTaskIdsSchema = `
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "List of Task IDs",
    "type": "object",
    "properties": {
        "taskIds": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    },
    "required": ["taskIds"]
}`;

// Initialize document ID
const docId = 'maxwell_ai_tasks';

// Initialize PouchlocalDb instance with the specified database name
const localDb = new PouchDB(config.localDbName);

// Function to validate task against JSON schema
function validateTask(taskString) {
    const functionName = "taskString";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        const task = JSON.parse(taskString);
        const validationResult = validateJson(task, taskSchema);

        // Return validation result
        if (validationResult.valid) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Task schema validation successful.";
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Task schema validation failed: " + validationResult.error;
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error parsing JSON: " + error.message;
    }
};

// Function to validate a list task  Ids against JSON schema
function validateTaskIds(taskIdsString) {
    const functionName = "taskIdsString";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Parse the input string into a JSON object
    try {
        const taskIdsJson = JSON.parse(taskIdsString);
        // Validate the JSON object against the notification IDs schema
        const validationResult = validateJson(taskIdsJson, listTaskIdsSchema);
        if (validationResult.valid) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Task IDs validation successful.";
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Task IDs validation failed: " + validationResult.error;
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error parsing JSON: " + error.message;
    }
}

// Function to create a new task
async function createTask(taskString) {
    const functionName = "createTask";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        const validationResult = validateTask(taskString);

        const taskJson = JSON.parse(taskString);
        if (validationResult.includes("successful")) {
            log("Entering function", config.verbosityLevel, 4, functionName);

            // Get existing tasks from the database
            const existingTasks = await localDb.get(docId);

            // Check if task ID already exists
            const existingIds = existingTasks.tasks.map(n => n._id);
            if (existingIds.includes(taskJson._id)) {
                return "Error: Task with this ID already exists.";
            }

            // Append the new task to the existing notifications
            existingTasks.tasks.push(taskJson);

            // Update the task document in the database
            const response = await localDb.put(existingTasks);
            
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Task created successfully.";
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return validationResult; // Return validation failure message
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error creating task: " + error.message;
    }
};

// Function to retrieve all tasks
async function getAllTasks() {
    const functionName = "getAllTasks";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Retrieve the document containing tasks from the database
        const response = await localDb.get(docId);
        // Return, as a string, the tasks array from the retrieved document
        const tasksString = JSON.stringify(response.tasks);
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return tasksString;
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error retrieving tasks: " + error.message;
    }
};

// Function to get a list of tasks by IDs
async function getTasksByIds(idsString) {
    const functionName = "getTasksByIds";

    // Log entry into the function
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Validate the input JSON containing the task IDs
        const validationResult = validateTaskIds(idsString);
        if (!validationResult.includes("successful")) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return validationResult; // Return validation failure message if not valid
        }

        // Parse the input string to extract IDs
        const idsJson = JSON.parse(idsString);
        // Retrieve the tasks document from the database
        const response = await localDb.get(docId);

        // Filter tasks to find those with the specified IDs
        const tasks = response.tasks.filter(task =>
            idsJson.taskIds.includes(task._id)
        );

        // Return found notifications or a not found message
        if (tasks.length > 0) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return JSON.stringify(tasks);
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Tasks not found";
        }
    } catch (error) {
        // Log and return error message
        log(error, config.verbosityLevel, 1, functionName);
        return "Error retrieving tasks by IDs: " + error.message;
    }
};

// Function to update a task
function updateTask(taskString) {
    const functionName = "updateTask";

    // Log entry into the function
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        const validationResult = validateTask(taskString);
        const taskJson = JSON.parse(taskString);
        if (validationResult.includes("successful")) {
            // Proceed with updating task

            // Retrieve the document containing tasks from the database
            return localDb.get(docId)
                .then(response => {
                    // Find the index of the task to be updated in the tasks array
                    log('Task to ID to update:', taskJson._id, config.verbosityLevel, 4, functionName);
                    const index = response.tasks.findIndex(n => n._id === taskJson._id);
                    if (index !== -1) {
                        // Update the task in the tasks array
                        response.tasks[index] = taskJson;
                        // Save the updated document back to the database
                        return localDb.put(response)
                            .then(() => {
                                log("Exiting function", config.verbosityLevel, 4, functionName);
                                return "Task updated successfully.";
                            });
                    } else {
                        log("Exiting function", config.verbosityLevel, 4, functionName);
                        return "Task not found";
                    }
                });
        } else {
            return validationResult; // Return validation failure message
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error updating task: " + error.message;
    }
}

// Function to delete a lsit tasks
async function deleteTasks(idsString) {
    const functionName = "deleteTasks";

    // Log entry into the function
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Validate the input JSON containing the task IDs
        const validationResult = validateTaskIds(idsString);
        if (!validationResult.includes("successful")) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return validationResult; // Return validation failure message if not valid
        }

        // Parse the input string to extract IDs
        const idsJson = JSON.parse(idsString);
        // Retrieve the tasks document from the database
        const response = await localDb.get(docId);

        // Remove tasks with the specified IDs
        response.tasks = response.tasks.filter(task =>
            !idsJson.taskIds.includes(task._id)
        );

        // Save the updated tasks document to the database
        const saveResponse = await localDb.put(response);
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return "Tasks deleted successfully.";
    } catch (error) {
        // Log and return error message
        log(error, config.verbosityLevel, 1, functionName);
        return "Error deleting tasks: " + error.message;
    }
};

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
        name: "Retrieve Tasks by ID",
        func: getTasksByIds,
        description: `Retrieves specific tasks from the database based on a list of IDs. Requires a JSON string of task IDs formatted according to the specified ${listTaskIdsSchema} schema.`
    },
    {
        name: "Update Task",
        func: updateTask,
        description: `Updates an existing task, validates its schema, and saves the updated data back to the database. Requires a task object with the updated data as input. The task object must be valid JSON that adheres to the specified ${taskSchema} schema.`
    },
    {
        name: "Delete Tasks by IDs",
        func: deleteTasks,
        description: `Deletes tasks from the database based on a list of IDs. Requires a JSON string of task IDs formatted according to the specified ${listTaskIdsSchema} schema.`
    }
];

const updateTasksPrompt = aiConfig.aiUpdateTasks;

// Test function for validateTask
function testValidateTask() {
    const validTask = JSON.stringify({
        _id: "task1",
        category: "Research",
        priority: "High",
        date_identified: "2023-01-01",
        date_and_time_start: "2023-01-02T09:00:00Z",
        target_date_and_time_completion: "2023-01-03T17:00:00Z",
        status: "Not Started",
        description: "Research on new AI techniques"
    });

    const invalidTask = JSON.stringify({}); // Missing required fields

    console.log("Testing validateTask with valid input:");
    console.log(validateTask(validTask)); // Should log 'Task schema validation successful.'
    
    console.log("Testing validateTask with invalid input:");
    console.log(validateTask(invalidTask)); // Should log 'Task schema validation failed: ...'
};

// Test function for createTask
async function testCreateTask() {
    const tasks = [
        JSON.stringify({
            _id: "task1",
            category: "Research",
            priority: "High",
            date_identified: "2023-01-01",
            date_and_time_start: "2023-01-02T09:00:00Z",
            target_date_and_time_completion: "2023-01-03T17:00:00Z",
            status: "Not Started",
            description: "Research on new AI techniques"
        }),
        JSON.stringify({
            _id: "task2",
            category: "Presentation Preparation",
            priority: "Medium",
            date_identified: "2023-01-04",
            date_and_time_start: "2023-01-05T10:00:00Z",
            target_date_and_time_completion: "2023-01-06T16:00:00Z",
            status: "Not Started",
            description: "Prepare slides for upcoming conference"
        })
    ];

    for (const task of tasks) {
        console.log("Creating a new task:");
        const createResult = await createTask(task);
        console.log(createResult);

        const taskObj = JSON.parse(task);
        if (createResult.includes("successfully")) {
            console.log(`Verifying the creation in the database for ID: ${taskObj._id}`);
            const allTasks = await getAllTasks();
            const tasksArray = JSON.parse(allTasks);
            const foundTask = tasksArray.find(t => t._id === taskObj._id);
            if (foundTask) {
                console.log(`Verification successful: Task with ID ${taskObj._id} is correctly stored in the database.`);
            } else {
                console.log(`Verification failed: Task with ID ${taskObj._id} is not correctly stored in the database.`);
            }
        }
    }
};

// Test function for getAllTasks
async function testGetAllTasks() {
    console.log("Retrieving all tasks:");
    console.log(await getAllTasks()); // Should log all tasks
};

// Test function for getTasksByIds
async function testGetTasksByIds() {
    const ids = JSON.stringify({ taskIds: ["task1", "task2"] });
    console.log("Retrieving tasks by IDs:");
    console.log(await getTasksByIds(ids)); // Should log tasks with ids "task1" and "task2"
};

// Test function for updateTask
async function testUpdateTask() {
    const updatedTask = JSON.stringify({
        _id: "task1",
        category: "Research",
        priority: "High",
        date_identified: "2023-01-01",
        date_and_time_start: "2023-01-02T09:00:00Z",
        target_date_and_time_completion: "2023-01-03T17:00:00Z",
        status: "In Progress",
        description: "Research on advanced AI techniques"
    });

    console.log("Updating a task:");
    console.log(await updateTask(updatedTask)); // Should log 'Task updated successfully.' or 'Task not found'
};

// Test function for deleteTasks
async function testDeleteTasks() {
    const idsToDelete = JSON.stringify({ taskIds: ["task1", "task2"] });
    console.log("Deleting tasks by IDs:");
    console.log(await deleteTasks(idsToDelete)); // Should log 'Tasks deleted successfully.'
};

// Test harness that runs all test functions
async function runTaskUtilsTestSuite() {
    testValidateTask();
    await testCreateTask();
    await testGetAllTasks();
    await testGetTasksByIds();
    await testUpdateTask();
    await testDeleteTasks();
};

// Export CRUD functions for tasks
export {
    runTaskUtilsTestSuite,
    validateTask,
    createTask,
    getAllTasks,
    getTasksByIds,
    updateTask,
    deleteTasks,
    taskTools,
    updateTasksPrompt
};
