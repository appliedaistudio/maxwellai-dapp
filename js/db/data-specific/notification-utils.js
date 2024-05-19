import config from "../../dapp-config.js";
import aiConfig from "../../ai/physarai/physarai-config.js";
import { validateJson } from "../../utils/string-parse.js";
import { log } from "../../utils/logging.js";

// Define a JSON schema for notifications
const notificationSchema = `
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Notification",
        "type": "object",
        "properties": {
            "_id": {
                "type": "string"
            },
            "topic": {
                "type": "string"
            },
            "body": {
                "type": "string"
            },
            "priority": {
                "type": "string",
                "enum": ["low", "medium", "high"]
            },
            "created_at": {
                "type": "string",
                "format": "date-time"
            },
            "status": {
                "type": "string",
                "enum": ["pending", "sent", "resolved"]
            },
            "actions": {
                "type": "object",
                "properties": {
                    "close": {
                        "type": "array",
                        "items": { "type": "string" }
                    },
                    "open": {
                        "type": "array",
                        "items": { "type": "string" }
                    }
                },
                "required": ["close", "open"]
            }
        },
        "required": ["_id", "topic", "body", "priority", "created_at", "status", "actions"]
    }`;

// Define a JSON schema for a list of notifications
const listNotificationIdsSchema = `
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "List of Notification IDs",
    "type": "object",
    "properties": {
        "notificationIds": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    },
    "required": ["notificationIds"]
}`;


// Initialize document ID
const docId = 'notifications';

// Initialize PouchlocalDb instance with the specified database name
const localDb = new PouchDB(config.localDbName);

// Function to validate notification against JSON schema
function validateNotification(notificationString) {
    const functionName = "validateNotification";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        const notification = JSON.parse(notificationString);
        const validationResult = validateJson(notification, notificationSchema);

        // Return validation result
        if (validationResult.valid) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Notification schema validation successful.";
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Notification schema validation failed: " + validationResult.error;
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error parsing JSON: " + error.message;
    }
};

// Function to validate a list notification Ids against JSON schema
function validateNotificationIds(notificationIdsString) {
    const functionName = "validateNotification";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Parse the input string into a JSON object
    try {
        const notificationIdsJson = JSON.parse(notificationIdsString);
        // Validate the JSON object against the notification IDs schema
        const validationResult = validateJson(notificationIdsJson, listNotificationIdsSchema);
        if (validationResult.valid) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Notification IDs validation successful.";
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Notification IDs validation failed: " + validationResult.error;
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error parsing JSON: " + error.message;
    }
}

// Function to create a new notification
async function createNotification(notificationString) {
    const functionName = "createNotification";
    log("Entering function", config.verbosityLevel, 4, functionName);
    
    try {
        const validationResult = validateNotification(notificationString);

        const notificationJson = JSON.parse(notificationString);
        if (validationResult.includes("successful")) {
            log("Entering function", config.verbosityLevel, 4, functionName);

            // Get existing notifications from the database
            const existingNotifications = await localDb.get(docId);

            // Check if notification ID already exists
            const existingIds = existingNotifications.notifications.map(n => n._id);
            if (existingIds.includes(notificationJson._id)) {
                log("Exiting function", config.verbosityLevel, 4, functionName);
                return "Error: Notification with this ID already exists.";
            }

            // Append the new notification to the existing notifications
            existingNotifications.notifications.push(notificationJson);

            // Update the notifications document in the database
            const response = await localDb.put(existingNotifications);
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Notification created successfully.";
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return validationResult; // Return validation failure message
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error creating notification: " + error.message;
    }
};

// Function to get all notifications
async function getAllNotifications() {
    const functionName = "getAllNotifications";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Retrieve the document containing notifications from the database
        const response = await localDb.get(docId);
        // Return, as a string, the notifications array from the retrieved document
        const notificationsString = JSON.stringify(response.notifications);
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return notificationsString;
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error retrieving notifications: " + error.message;
    }
};

// Function to get a list of notifications by IDs
async function getNotificationsByIds(idsString) {
    // Log entry into the function
    const functionName = "getNotificationsByIds";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Validate the input JSON containing the notification IDs
        const validationResult = validateNotificationIds(idsString);
        if (!validationResult.includes("successful")) {
            return validationResult; // Return validation failure message if not valid
        }

        // Parse the input string to extract IDs
        const idsJson = JSON.parse(idsString);
        // Retrieve the notifications document from the database
        const response = await localDb.get(docId);

        // Filter notifications to find those with the specified IDs
        const notifications = response.notifications.filter(notification =>
            idsJson.notificationIds.includes(notification._id)
        );

        // Return found notifications or a not found message
        if (notifications.length > 0) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return JSON.stringify(notifications);
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return "Notifications not found";
        }
    } catch (error) {
        // Log and return error message
        log(error, config.verbosityLevel, 3, functionName);
        return "Error retrieving notifications by IDs: " + error.message;
    }
};

// Function to update a notification
function updateNotification(notificationString) {
    const functionName = "updateNotification";

    // Log entry into the function
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        const validationResult = validateNotification(notificationString);
        const notificationJson = JSON.parse(notificationString);
        if (validationResult.includes("successful")) {
            // Proceed with updating notification

            // Retrieve the document containing notifications from the database
            return localDb.get(docId)
                .then(response => {
                    // Find the index of the notification to be updated in the notifications array
                    log('Notification to ID to update:', notificationJson._id, config.verbosityLevel, 4, functionName);
                    const index = response.notifications.findIndex(n => n._id === notificationJson._id);
                    if (index !== -1) {
                        // Update the notification in the notifications array
                        response.notifications[index] = notificationJson;
                        // Save the updated document back to the database
                        return localDb.put(response)
                            .then(() => {
                                log("Exiting function", config.verbosityLevel, 4, functionName);
                                return "Notification updated successfully.";
                            });
                    } else {
                        log("Exiting function", config.verbosityLevel, 4, functionName);
                        return "Notification not found";
                    }
                });
        } else {
            return validationResult; // Return validation failure message
        }
    } catch (error) {
        log(error, config.verbosityLevel, 1, functionName);
        return "Error updating notification: " + error.message;
    }
};

// Function to delete a lsit notifications
async function deleteNotifications(idsString) {
    const functionName = "deleteNotifications";

    // Log entry into the function
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Validate the input JSON containing the notification IDs
        const validationResult = validateNotificationIds(idsString);
        if (!validationResult.includes("successful")) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return validationResult; // Return validation failure message if not valid
        }

        // Parse the input string to extract IDs
        const idsJson = JSON.parse(idsString);
        // Retrieve the notifications document from the database
        const response = await localDb.get(docId);

        // Remove notifications with the specified IDs
        response.notifications = response.notifications.filter(notification =>
            !idsJson.notificationIds.includes(notification._id)
        );

        // Save the updated notifications document to the database
        const saveResponse = await localDb.put(response);
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return "Notifications deleted successfully.";
    } catch (error) {
        // Log and return error message
        log(error, config.verbosityLevel, 1, functionName);
        return "Error deleting notifications: " + error.message;
    }
};

const notificationTools = [
    {
        name: "Notification JSON Schema Validation",
        func: validateNotification,
        description: `Validates notification data against a JSON schema to ensure conformity before performing CRUD operations. Requires a notification object as input. The notification object must be valid JSON that adheres to the specified ${notificationSchema} schema.`
    },
    {
        name: "Create Notification",
        func: createNotification,
        description: `Creates a new notification, validates its schema, and inserts it into the database. Requires, as input, an object representing a single notification. The notification object must be valid JSON that adheres to the specified ${notificationSchema} schema.`
    },
    {
        name: "Retrieve All Notifications",
        func: getAllNotifications,
        description: "Retrieves all existing notifications from the database and returns them as an array. No input required."
    },
    {
        name: "Retrieve Notifications by IDs",
        func: getNotificationsByIds,
        description: `Retrieves specific notifications from the database based on a list of IDs. Requires a JSON string of notification IDs formatted according to the specified ${listNotificationIdsSchema} schema.`
    },
    {
        name: "Update Notification",
        func: updateNotification,
        description: `Updates an existing notification, validates its schema, and saves the updated data back to the database. Requires a notification object with the updated data as input. The notification object must be valid JSON that adheres to the specified ${notificationSchema} schema.`
    },
    {
        name: "Delete Notifications by IDs",
        func: deleteNotifications,
        description: `Deletes notifications from the database based on a list of IDs. Requires a JSON string of notification IDs formatted according to the specified ${listNotificationIdsSchema} schema.`
    }
];

const updateNotificationsPrompt = aiConfig.aiUpdateNotifications;

// Test function for validateNotification
function testValidateNotification() {
    const validNotification = JSON.stringify({
        _id: "1",
        topic: "Update",
        body: "Your application has been updated",
        priority: "high",
        created_at: "2022-01-01T12:00:00Z",
        status: "pending",
        actions: {
            close: ["archive"],
            open: ["read"]
        }
    });

    const invalidNotification = JSON.stringify({}); // Missing required fields

    console.log("Testing validateNotification with valid input:");
    console.log(validateNotification(validNotification)); // Should log 'Notification schema validation successful.'
    
    console.log("Testing validateNotification with invalid input:");
    console.log(validateNotification(invalidNotification)); // Should log 'Notification schema validation failed: ...'
}

// Test function for createNotification
async function testCreateNotification() {
    // Array of notifications to be created, each structured as a JSON string
    const notifications = [
        JSON.stringify({
            _id: "test1",
            topic: "Reminder",
            body: "Don't forget the meeting at 3 PM",
            priority: "medium",
            created_at: "2022-01-02T15:00:00Z",
            status: "pending",
            actions: {
                close: ["dismiss"],
                open: ["view"]
            }
        }),
        JSON.stringify({
            _id: "test2",
            topic: "Alert",
            body: "System maintenance tonight at 12 AM",
            priority: "high",
            created_at: "2022-01-03T20:00:00Z",
            status: "pending",
            actions: {
                close: ["archive"],
                open: ["view details"]
            }
        })
    ];

    // Loop over each notification for creation and validation
    for (const notification of notifications) {
        console.log("Creating a new notification:");
        const createResult = await createNotification(notification);
        console.log(createResult); // Log the result of the creation attempt

        // Parse the notification string back into an object
        const notificationObj = JSON.parse(notification);
        // If the notification creation is successful, verify it in the database
        if (createResult.includes("successfully")) {
            console.log(`Verifying the creation in the database for ID: ${notificationObj._id}`);
            const allNotifications = await getAllNotifications();
            const notificationsArray = JSON.parse(allNotifications);
            // Find the newly created notification by its ID
            const foundNotification = notificationsArray.find(n => n._id === notificationObj._id);
            // Verify that the 'close' action of the notification is as expected
            if (foundNotification && foundNotification.actions.close.includes(notificationObj.actions.close[0])) {
                console.log(`Verification successful: Notification with ID ${notificationObj._id} is correctly stored in the database.`);
            } else {
                console.log(`Verification failed: Notification with ID ${notificationObj._id} is not correctly stored in the database.`);
            }
        }
    }
};

// Test function for getAllNotifications
async function testGetAllNotifications() {
    console.log("Retrieving all notifications:");
    console.log(await getAllNotifications()); // Should log all notifications
};

// Test function for getNotificationsByIds
async function testGetNotificationsByIds() {
    const ids = JSON.stringify({ notificationIds: ["test1", "test2"] });
    console.log("Retrieving notifications by IDs:");
    console.log(await getNotificationsByIds(ids)); // Should log notifications with ids 1 and 2
};

// Test function for updateNotification
async function testUpdateNotification() {
    const updatedNotification = JSON.stringify({
        _id: "test1",
        topic: "Update",
        body: "Your application update is complete",
        priority: "high",
        created_at: "2022-01-01T12:00:00Z",
        status: "resolved",
        actions: {
            close: ["archive"],
            open: ["read"]
        }
    });

    console.log("Updating a notification:");
    console.log(await updateNotification(updatedNotification)); // Should log 'Notification updated successfully.' or 'Notification not found'
};

// Test function for deleteNotifications
async function testDeleteNotifications() {
    const idsToDelete = JSON.stringify({ notificationIds: ["test1", "test2"] });
    console.log("Deleting notifications by IDs:");
    console.log(await deleteNotifications(idsToDelete)); // Should log 'Notifications deleted successfully.'
};

// Test harness that runs all test functions
async function runNotificationUtilsTestSuite() {
    testValidateNotification();
    await testCreateNotification();
    await testGetAllNotifications();
    await testGetNotificationsByIds();
    await testUpdateNotification();
    await testDeleteNotifications();
};

// Export CRUD functions and tools
export {
    runNotificationUtilsTestSuite,
    validateNotification,
    createNotification,
    getAllNotifications,
    getNotificationsByIds,
    updateNotification,
    deleteNotifications,
    notificationTools,
    updateNotificationsPrompt
};
