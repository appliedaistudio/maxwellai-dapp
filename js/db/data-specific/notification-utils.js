import config from "../../dapp-config.js";
import { validateJson } from "../../utils/string-parse.js";

// Define a JSON schema for notifications
const notificationSchema = `
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Notification",
        "type": "object",
        "properties": {
        "_id": {
            "type": "integer"
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

// Function to validate notification against JSON schema using tv4
function validateNotification(notification) {
    const validationResult = validateJson(notification, notificationSchema);
    if (!validationResult.valid) {
        throw new Error('Notification schema validation failed: ' + validationResult.error);
    }
}

// Function to create a new notification
function createNotification(notification) {
    try {
        // Validate notification schema
        validateNotification(notification);
        // Insert the new notification document into the database
        return localDb.post(notification)
            .then(response => {
                return response;
            });
    } catch (error) {
        throw error;
    }
}

// Function to get all notifications synchronously
async function getAllNotifications() {
    try {
        // Retrieve the document containing notifications from the database
        const response = await localDb.get(docId);
        // Return the notifications array from the retrieved document
        return response.notifications;
    } catch (error) {
        throw error;
    }
}

// Function to get a notification by ID
function getNotificationById(id) {
    try {
        // Retrieve the document containing notifications from the database
        return localDb.get(docId)
            .then(response => {
                // Find the notification with the specified ID from the notifications array in the document
                const notification = response.notifications.find(notification => notification._id === id);
                if (notification) {
                    return notification;
                } else {
                    throw new Error('Notification not found');
                }
            });
    } catch (error) {
        throw error;
    }
}

// Function to update a notification
function updateNotification(notification) {
    try {
        // Validate notification schema
        validateNotification(notification);
        // Retrieve the document containing notifications from the database
        return localDb.get(docId)
            .then(response => {
                // Find the index of the notification to be updated in the notifications array
                const index = response.notifications.findIndex(n => n._id === notification._id);
                if (index !== -1) {
                    // Update the notification in the notifications array
                    response.notifications[index] = notification;
                    // Save the updated document back to the database
                    return localDb.put(response)
                        .then(() => {
                            return { updated: true };
                        });
                } else {
                    throw new Error('Notification not found');
                }
            });
    } catch (error) {
        throw error;
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
                            return { deleted: true };
                        });
                } else {
                    throw new Error('Notification not found');
                }
            });
    } catch (error) {
        throw error;
    }
}


const notificationTools = [
    {
        name: "Notification JSON Schema Validation",
        func: validateNotification,
        description: `Validates notification data against a JSON schema to ensure conformity before performing CRUD operations. Requires a notification object as input. The notification object must adhere to the specified ${notificationSchema} schema.`
    },
    {
        name: "Create Notification",
        func: createNotification,
        description: `Creates a new notification, validates its schema, and inserts it into the database. Requires, as input, an object representing a single notification. The notification object must adhere to the specified ${notificationSchema} schema.`
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
        description: `Updates an existing notification, validates its schema, and saves the updated data back to the database. Requires a notification object with the updated data as input. The notification object must adhere to the specified ${notificationSchema} schema.`
    },
    {
        name: "Delete Notification",
        func: deleteNotification,
        description: "Deletes a notification from the database based on its ID. Requires the ID of the notification to be deleted as input."
    }
];

const updateNotificationsPrompt = "Revise notifications by integrating new notifications and refining existing ones using insights collected from user interactions"

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
