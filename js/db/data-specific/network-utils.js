import config from "../../dapp-config.js";
import aiConfig from "../../ai/physarai-config.js";
import { validateJson } from "../../utils/string-parse.js";
import { log } from "../../utils/logging.js";

// Define valid network entity types
const validEntityTypes = ['websites', 'contacts', 'devices'];

// Define a JSON schema for network entity functions parameters
const networkEntityParamsSchema = `
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "entityType": {
            "type": "string",
            "enum": ${JSON.stringify(validEntityTypes)}
        },
        "networkEntityString": {
            "type": "string",
            "format": "json"
        },
        "id": {
            "type": "string"
        }
    },
    "required": ["entityType"]
}`;

// Define a JSON schema for network entities
const networkEntitySchema = `
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "NetworkEntity",
    "type": "object",
    "properties": {
        "_id": {
            "type": "string"
        },
        "url": {
            "type": "string",
            "format": "uri"
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
            "type": "string",
            "format": "uri"
        }
    },
    "required": ["_id", "description", "category", "review_status"]
}`;

// Initialize document ID for the network data
const networkDocId = 'maxwellai_network';

// Initialize PouchlocalDb instance with the specified database name for networks
const localDb = new PouchDB(config.localDbName);

// Function to validate a network entity against the JSON schema
function validateNetworkEntity(networkEntity) {
    const validationResult = validateJson(networkEntity, networkEntitySchema);
    if (!validationResult.valid) {
        throw new Error('Network entity schema validation failed: ' + validationResult.error);
    }
}

// Function to validate the parameters for network entity functions
function validateParams(params) {
    const validationResult = validateJson(params, networkEntityParamsSchema);
    if (!validationResult.valid) {
        throw new Error('Parameter validation failed: ' + validationResult.error);
    }
}

// Function to create a new network entity
async function createNetworkEntity(params) {
    validateParams(params);
    const { entityType, networkEntityString } = params;
    console.log(`creating a new network entity in ${entityType}`);
    try {
        const networkEntityJson = JSON.parse(networkEntityString);
        validateNetworkEntity(networkEntityJson);

        const networkDoc = await localDb.get(networkDocId);
        networkDoc.data[entityType].data.push(networkEntityJson);

        const response = await localDb.put(networkDoc);
        return response;
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'createNetworkEntity');
    }
}

// Function to retrieve all network entities of a given type
async function getAllNetworkEntities(params) {
    validateParams(params);
    const { entityType } = params;
    console.log(`getting all network entities from ${entityType}`);
    try {
        const response = await localDb.get(networkDocId);
        const networkEntitiesString = JSON.stringify(response.data[entityType].data);
        return networkEntitiesString;
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'getAllNetworkEntities');
    }
}

// Function to retrieve a network entity by ID and type
function getNetworkEntityById(params) {
    validateParams(params);
    const { entityType, id } = params;
    console.log(`getting network entity by id from ${entityType}`);
    try {
        return localDb.get(networkDocId)
            .then(response => {
                const networkEntity = response.data[entityType].data.find(entity => entity._id === id);
                if (networkEntity) {
                    return networkEntity;
                } else {
                    throw new Error('Network entity not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'getNetworkEntityById');
    }
}

// Function to update a network entity
function updateNetworkEntity(params) {
    validateParams(params);
    const { entityType, networkEntityString } = params;
    console.log(`updating network entity in ${entityType}`);
    try {
        const networkEntityJson = JSON.parse(networkEntityString);
        validateNetworkEntity(networkEntityJson);

        return localDb.get(networkDocId)
            .then(response => {
                const index = response.data[entityType].data.findIndex(entity => entity._id === networkEntityJson._id);
                if (index !== -1) {
                    response.data[entityType].data[index] = networkEntityJson;
                    return localDb.put(response)
                        .then(() => {
                            return { updated: true };
                        });
                } else {
                    throw new Error('Network entity not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'updateNetworkEntity');
    }
}

// Function to delete a network entity
function deleteNetworkEntity(params) {
    validateParams(params);
    const { entityType, id } = params;
    console.log(`deleting network entity from ${entityType}`);
    try {
        return localDb.get(networkDocId)
            .then(response => {
                const index = response.data[entityType].data.findIndex(entity => entity._id === id);
                if (index !== -1) {
                    response.data[entityType].data.splice(index, 1);
                    return localDb.put(response)
                        .then(() => {
                            return { deleted: true };
                        });
                } else {
                    throw new Error('Network entity not found');
                }
            });
    } catch (error) {
        log(error, config.verbosityLevel, 3, 'deleteNetworkEntity');
    }
}

const networkTools = [
    {
        name: "Network Entity JSON Schema Validation",
        func: validateNetworkEntity,
        description: `Validates the data of a network entity against a JSON schema to ensure conformity before performing CRUD operations. Requires a JSON object representing a network entity as input. The object must adhere to the specified ${networkEntitySchema} schema.`
    },
    {
        name: "Create A Network Entity",
        func: createNetworkEntity,
        description: `Creates a new network entity after validating its schema and inserts it into the database. Requires a JSON object with 'entityType' specifying the type of entity (one of ${validEntityTypes.join(', ')}), and 'networkEntityString' containing the network entity data as a JSON string.`
    },
    {
        name: "Retrieve All Network Entities",
        func: getAllNetworkEntities,
        description: `Retrieves all network entities of a specified type from the database. Requires a JSON object with 'entityType' specifying the type of entity (one of ${validEntityTypes.join(', ')}) as input. Returns a JSON string of all entities.`
    },
    {
        name: "Retrieve Network Entity by ID",
        func: getNetworkEntityById,
        description: `Retrieves a specific network entity based on its ID from the specified entity type. Requires a JSON object with 'entityType' and 'id' specifying the type and ID of the network entity.`
    },
    {
        name: "Update Network Entity",
        func: updateNetworkEntity,
        description: `Updates an existing network entity after validating its schema. Requires a JSON object with 'entityType' specifying the type of entity and 'networkEntityString' containing the updated network entity data as a JSON string.`
    },
    {
        name: "Delete Network Entity",
        func: deleteNetworkEntity,
        description: `Deletes a network entity from the database based on its ID. Requires a JSON object with 'entityType' and 'id' specifying the type and ID of the entity to be deleted.`
    }
];

const updateNetworkPrompt = aiConfig.aiUpdateNetwork;

// Export CRUD functions and tools for the network data
export {
    validateNetworkEntity,
    createNetworkEntity,
    getAllNetworkEntities,
    getNetworkEntityById,
    updateNetworkEntity,
    deleteNetworkEntity,
    networkTools,
    updateNetworkPrompt
};
