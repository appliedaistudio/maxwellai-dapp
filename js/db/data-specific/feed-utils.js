import config from "../../dapp-config.js";
import aiConfig from "../../ai/physarai-config.js";
import { validateJson } from "../../utils/string-parse.js";
import { log } from "../../utils/logging.js";

// Define a JSON schema for external resources
const externalResourceSchema = `
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Feed",
        "type": "object",
        "properties": {
            "_id": {
                "type": "string"
            },
            "url": {
                "type": "string"
            },
            "description": {
                "type": "string"
            },
            "usefulness_description": {
                "type": "string"
            },
            "category": {
                "type": "string"
            },
            "review_status": {
                "type": "string",
                "enum": ["Pending", "Reviewed", "Not Suitable"]
            },
            "thumbnail_url": {
                "type": "string"
            }
        },
        "required": ["_id", "url", "description", "usefulness_description", "category", "review_status", "thumbnail_url"]
    }`;

// Initialize document ID for the feed of external resources
const feedDocId = 'maxwell_ai_feed';

// Initialize PouchlocalDb instance with the specified database name for feeds
const localDb = new PouchDB(config.localDbName);

// Function to validate an external resource against the JSON schema
function validateAnExternalResource(externalResource) {
    const validationResult = validateJson(externalResource, externalResourceSchema);
    if (!validationResult.valid) {
        throw new Error('External resource schema validation failed: ' + validationResult.error);
    }
}

// Function to create a new external resource
async function createExternalResource(externalResourceString) {
    console.log("creating a new external resource");
    try {
        const externalResourceJson = JSON.parse(externalResourceString);
        validateAnExternalResource(externalResourceJson);

        const externalResourcesFeedDoc = await localDb.get(feedDocId);
        externalResourcesFeedDoc.urls_to_browse.push(externalResourceJson);

        const response = await localDb.put(externalResourcesFeedDoc);
        return response;
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'createExternalResource');
    }
}

// Function to retrieve the feed of all external resources
async function getAllExternalResources() {
    console.log("getting all external resources");
    try {
        const response = await localDb.get(feedDocId);
        const externalResourcesString = JSON.stringify(response.urls_to_browse);
        return externalResourcesString;
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'getAllExternalResources');
    }
}

// Function to retrieve an external resource by ID
function getExternalResourceById(id) {
    console.log("getting resources by id");
    try {
        return localDb.get(feedDocId)
            .then(response => {
                const externalResources = response.urls_to_browse.find(externalResources => externalResources._id === id);
                if (externalResources) {
                    return externalResources;
                } else {
                    throw new Error('External resource not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'getExternalResourceById');
    }
}

// Function to update an external resource
function updateExternalResource(externalResourceString) {
    console.log("updating external resource");
    try {
        const externalResourceJson = JSON.parse(externalResourceString);
        validateAnExternalResource(externalResourceJson);

        return localDb.get(feedDocId)
            .then(response => {
                const index = response.urls_to_browse.findIndex(externalResource => externalResource._id === externalResourceJson._id);
                if (index !== -1) {
                    response.urls_to_browse[index] = externalResourceJson;
                    return localDb.put(response)
                        .then(() => {
                            return { updated: true };
                        });
                } else {
                    throw new Error('External resource not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'updateExternalResource');
    }
}

// Function to delete an external resource
function deleteExternalResource(id) {
    console.log("deleting external resource");
    try {
        return localDb.get(feedDocId)
            .then(response => {
                const index = response.urls_to_browse.findIndex(externalResource => externalResource._id === id);
                if (index !== -1) {
                    response.urls_to_browse.splice(index, 1);
                    return localDb.put(response)
                        .then(() => {
                            return { deleted: true };
                        });
                } else {
                    throw new Error('External resource not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'deleteExternalResource');
    }
}

const externalResourcesFeedTools = [
    {
        name: "External Resource JSON Schema Validation",
        func: validateAnExternalResource,
        description: `Validates the data of an external resource against a JSON schema to ensure conformity before performing CRUD operations. Requires an external resource object as input. The external resource object must be valid JSON that adheres to the specified ${externalResourceSchema} schema.`
    },
    {
        name: "Create An External Resource",
        func: createExternalResource,
        description: `Creates a new external resource, validates its schema, and inserts it into the database. Requires, as input, an object representing a single external resource. The external resource object must be valid JSON that adheres to the specified ${externalResourceSchema} schema.`
    },
    {
        name: "Retrieve All External Resources",
        func: getAllExternalResources,
        description: "Retrieves all existing external resources from the database. No input required."
    },
    {
        name: "Retrieve External Resource by ID",
        func: getExternalResourceById,
        description: "Retrieves a specific external resource from the database based on its ID. Requires the ID of the external resource as input."
    },
    {
        name: "Update External Resource",
        func: updateExternalResource,
        description: `Updates an existing external resource, validates its schema, and saves the updated data back to the database. Requires an external resource object with an existing external resource ID and the updated data as input. The external resource object must be valid JSON that adheres to the specified ${externalResourceSchema} schema.`
    },
    {
        name: "Delete External Resource",
        func: deleteExternalResource,
        description: "Deletes an external resource from the database based on its ID. Requires, as input, the ID of the external resource to be deleted."
    }
];

const updateExternalResourcesFeedPrompt = aiConfig.aiUpdateFeed;

// Export CRUD functions and tools for the feed of external resources
export {
    validateAnExternalResource,
    createExternalResource,
    getAllExternalResources,
    getExternalResourceById,
    updateExternalResource,
    deleteExternalResource,
    externalResourcesFeedTools,
    updateExternalResourcesFeedPrompt
};
