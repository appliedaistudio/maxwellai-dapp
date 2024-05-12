import config from "../../dapp-config.js";
import aiConfig from "../../ai/physarai-config.js";
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

// Initialize document ID
const docId = 'notifications';

// Initialize PouchlocalDb instance with the specified database name
const localDb = new PouchDB(config.localDbName);

// Function to validate notification against JSON schema
function validateNotification(notificationString) {
    try {
        const notification = JSON.parse(notificationString);
        const validationResult = validateJson(notification, notificationSchema);
        if (validationResult.valid) {
            return "Notification schema validation successful.";
        } else {
            return "Notification schema validation failed: " + validationResult.error;
        }
    } catch (error) {
        return "Error parsing JSON: " + error.message;
    }
};

// Function to create a new notification
async function createNotification(notificationString) {
    try {
        const notificationJson = JSON.parse(notificationString);
        const validationResult = validateNotification(notificationJson);
        if (validationResult.includes("successful")) {
            // Proceed with creating notification
            log("Entering function", config.verbosityLevel, 4, "createNotification");

            // Validate notification Json against the schema
            validateNotification(notificationJson);

            // Get existing notifications from the database
            const existingNotifications = await localDb.get('notifications');

            // Append the new notification to the existing notifications
            existingNotifications.notifications.push(notificationJson);

            // Update the notifications document in the database
            const response = await localDb.put(existingNotifications);

            return "Notification created successfully.";
        } else {
            return validationResult; // Return validation failure message
        }
    } catch (error) {
        return "Error creating notification: " + error.message;
    }
}

// Function to get all notifications
async function getAllNotifications() {
    const functionName = "getAllNotifications";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Retrieve the document containing notifications from the database
        const response = await localDb.get(docId);
        // Return, as a string. the notifications array from the retrieved document
        const notificationsString = JSON.stringify(response.notifications);
        return notificationsString;
    } catch (error) {
        log(error, config.verbosityLevel, 3, functionName);
        return "Error retrieving notifications: " + error.message;
    }
}

// Function to get a notification by ID
function getNotificationById(id) {
    const functionName = "getNotificationById";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Retrieve the document containing notifications from the database
        return localDb.get(docId)
            .then(response => {
                // Find the notification with the specified ID from the notifications array in the document
                const notification = response.notifications.find(notification => notification._id === id);
                if (notification) {
                    return notification;
                } else {
                    return "Notification not found";
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, functionName);
        return "Error retrieving notification by ID: " + error.message;
    }
}

// Function to update a notification
function updateNotification(notificationString) {
    try {
        const notificationJson = JSON.parse(notificationString);
        const validationResult = validateNotification(notificationJson);
        if (validationResult.includes("successful")) {
            // Proceed with updating notification
            log("Entering function", config.verbosityLevel, 4, "updateNotification");

            // Validate notification schema
            validateNotification(notificationJson);
            // Retrieve the document containing notifications from the database
            return localDb.get(docId)
                .then(response => {
                    // Find the index of the notification to be updated in the notifications array
                    console.log('Notification to update ID:', notificationJson._id);
                    const index = response.notifications.findIndex(n => n._id === notificationJson._id);
                    if (index !== -1) {
                        // Update the notification in the notifications array
                        response.notifications[index] = notificationJson;
                        // Save the updated document back to the database
                        return localDb.put(response)
                            .then(() => {
                                return "Notification updated successfully.";
                            });
                    } else {
                        return "Notification not found";
                    }
                });
        } else {
            return validationResult; // Return validation failure message
        }
    } catch (error) {
        return "Error updating notification: " + error.message;
    }
}

// Function to delete a notification
function deleteNotification(id) {
    try {
        // Retrieve the document containing notifications from the database
        return localDb.get(docId)
            .then(response => {
                // Find the index of the notification to be deleted in the notifications array
                const index = response.notifications.findIndex(notification => notification._id === id);
                if (index !== -1) {
                    // Remove the notification from the notifications array
                    response.notifications.splice(index, 1);
                    // Save the updated document back to the database
                    return localDb.put(response)
                        .then(() => {
                            return "Notification deleted successfully.";
                        });
                } else {
                    return "Notification not found";
                }
            });
    } catch (error) {
        return "Error deleting notification: " + error.message;
    }
}


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
        name: "Retrieve Notification by ID",
        func: getNotificationById,
        description: "Retrieves a specific notification from the database based on its ID. Requires the ID of the notification as input."
    },
    {
        name: "Update Notification",
        func: updateNotification,
        description: `Updates an existing notification, validates its schema, and saves the updated data back to the database. Requires a notification object with the updated data as input. The notification object must be valid JSON that adheres to the specified ${notificationSchema} schema.`
    },
    {
        name: "Delete Notification",
        func: deleteNotification,
        description: "Deletes a notification from the database based on its ID. Requires the ID of the notification to be deleted as input."
    }
];

const updateNotificationsPrompt = aiConfig.aiUpdateNotifications;

// Export CRUD functions and tools
export {
    validateNotification,
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    notificationTools,
    updateNotificationsPrompt
};
