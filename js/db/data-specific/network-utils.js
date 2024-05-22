import config from "../../dapp-config.js";
import { aiConfig } from "../../ai/physarai/physarai-config.js";
import { validateJson } from "../../utils/string-parse.js";
import { log } from "../../utils/logging.js";

// Define valid network entity types
const validEntityTypes = ['websites', 'contacts', 'devices'];

// JSON schemas for each entity type
const websitesSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Website",
    "type": "object",
    "properties": {
        "_id": { "type": "string" },
        "url": { "type": "string", "format": "uri" },
        "description": { "type": "string" },
        "usefulness_description": { "type": "string" },
        "category": { "type": "string", "enum": ["Research & Reference", "Cybersecurity Resources"] },
        "review_status": { "type": "string", "enum": ["Pending", "Reviewed"] },
        "thumbnail_url": { 
            "type": "string", 
            "format": "uri",
            "const": "https://picsum.photos/id/445/200" 
        }
    },
    "required": ["_id", "url", "description", "usefulness_description", "category", "review_status", "thumbnail_url"]
};

const contactsSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Contact",
    "type": "object",
    "properties": {
        "_id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string", "pattern": "^(\\d{3}-\\d{3}-\\d{4})$" },
        "relationship": { "type": "string" },
        "category": { "type": "string", "enum": ["Networking", "Personal"] },
        "review_status": { "type": "string", "enum": ["Reviewed", "Not Suitable"] },
        "thumbnail_url": { 
            "type": "string", 
            "format": "uri",
            "const": "https://picsum.photos/id/160/200" 
        }
    },
    "required": ["_id", "name", "email", "phone", "relationship", "category", "review_status", "thumbnail_url"]
};

const devicesSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Device",
    "type": "object",
    "properties": {
        "_id": { "type": "string" },
        "name": { "type": "string" },
        "type": { "type": "string" },
        "location": { "type": "string" },
        "api_info": {
            "type": "object",
            "properties": {
                "url": { "type": "string", "format": "uri" },
                "auth_token": { "type": "string" }
            },
            "required": ["url", "auth_token"]
        },
        "category": { "type": "string", "enum": ["Utility"] },
        "review_status": { "type": "string", "enum": ["Pending", "Reviewed"] },
        "thumbnail_url": { 
            "type": "string", 
            "format": "uri",
            "const": "https://picsum.photos/id/36/200" 
        }
    },
    "required": ["_id", "name", "type", "location", "api_info", "category", "review_status", "thumbnail_url"]
};

// Define the schema for params
const paramsSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Params",
    "type": "object",
    "properties": {
        "entityTypeString": {
            "type": "string",
            "enum": ["websites", "contacts", "devices"]
        },
        "networkEntityJson": {
            "type": "object"
        }
    },
    "required": ["entityTypeString", "networkEntityJson"]
};

// Function to validate a network entity against the JSON schema
function validateNetworkEntity(networkEntityString, entityType) {
    const functionName = "validateNetworkEntity";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Check if the entityType is valid
    if (!validEntityTypes.includes(entityType)) {
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return "Invalid network entity type: " + entityType;
    }

    const entitySchema = entitySchemas[entityType];

    try {
        // Parse the network entity string into JSON
        const networkEntity = JSON.parse(networkEntityString);

        // Validate the parsed JSON against the selected schema
        const validationResult = validateJson(networkEntity, entitySchema);

        // Check if validation failed and throw an error if it did
        if (!validationResult.valid) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return 'Network entity schema validation failed: ' + validationResult.error;
        }
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return 'Network entity validation successful';
    } catch (error) {
        // Handle JSON parsing errors
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error parsing JSON: ' + error.message;
    }
};

// Function to validate params against the schema
function validateParams(paramsString) {
    const functionName = "validateParams";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        const paramsJson = JSON.parse(paramsString);
        const validationResult = validateJson(paramsJson, paramsSchema);
        if (!validationResult.valid) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return 'Params validation failed: ' + validationResult.error;
        }
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return 'Params validation successful';
    } catch (error) {
        // Handle JSON validation errors
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error validating parms ' + error.message;
    }
};

// Define a collection of schemas for each entityType
const entitySchemas = {
    websites: websitesSchema,
    contacts: contactsSchema,
    devices: devicesSchema
};

// Initialize document ID for the network data
const networkDocId = 'network';
const feedbackDocId = 'network_feedback';

// Initialize PouchlocalDb instance with the specified database name for networks
const localDb = new PouchDB(config.localDbName);

// Function to get a list of potential contacts
function getPotentialContacts() {
    const functionName = "getPotentialContacts";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Return a list of simulated potential contacts
    log("Exiting function", config.verbosityLevel, 4, functionName);
    const contacts =  [
        {
            "_id": "contact_sim1",
            "name": "Alice Johnson",
            "email": "alice.johnson@example.com",
            "phone": "555-123-4567",
            "relationship": "Colleague",
            "category": "Networking",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/16/200"
        },
        {
            "_id": "contact_sim2",
            "name": "Bob Smith",
            "email": "bob.smith@example.com",
            "phone": "555-234-5678",
            "relationship": "Friend",
            "category": "Personal",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/17/200"
        },
        {
            "_id": "contact_sim3",
            "name": "Carol White",
            "email": "carol.white@example.com",
            "phone": "555-345-6789",
            "relationship": "Family",
            "category": "Personal",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/18/200"
        },
        {
            "_id": "contact_sim4",
            "name": "David Brown",
            "email": "david.brown@example.com",
            "phone": "555-456-7890",
            "relationship": "Acquaintance",
            "category": "Networking",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/19/200"
        },
        {
            "_id": "contact_sim5",
            "name": "Eve Davis",
            "email": "eve.davis@example.com",
            "phone": "555-567-8901",
            "relationship": "Business Partner",
            "category": "Networking",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/20/200"
        }
    ];
    return JSON.stringify(contacts);
};

// Function to get a list of potential devices
function getPotentialDevices() {
    const functionName = "getPotentialDevices";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Return a list of simulated potential devices
    log("Exiting function", config.verbosityLevel, 4, functionName);
    const devices = [
        {
            "_id": "device_sim1",
            "name": "Smart Thermostat",
            "type": "Thermostat",
            "location": "Living Room",
            "api_info": {
                "url": "https://api.example.com/thermostat",
                "auth_token": "XXXXXXXXXXXXXXXX"
            },
            "category": "Utility",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/21/200"
        },
        {
            "_id": "device_sim2",
            "name": "Security Camera",
            "type": "Camera",
            "location": "Front Door",
            "api_info": {
                "url": "https://api.example.com/camera",
                "auth_token": "YYYYYYYYYYYYYYYY"
            },
            "category": "Utility",
            "review_status": "Pending",
            "thumbnail_url": "https://picsum.photos/seed/22/200"
        },
        {
            "_id": "device_sim3",
            "name": "Smart Light",
            "type": "Light",
            "location": "Bedroom",
            "api_info": {
                "url": "https://api.example.com/light",
                "auth_token": "ZZZZZZZZZZZZZZZZ"
            },
            "category": "Utility",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/23/200"
        },
        {
            "_id": "device_sim4",
            "name": "Smart Speaker",
            "type": "Speaker",
            "location": "Kitchen",
            "api_info": {
                "url": "https://api.example.com/speaker",
                "auth_token": "AAAAAAAAAAAAAAAA"
            },
            "category": "Utility",
            "review_status": "Reviewed",
            "thumbnail_url": "https://picsum.photos/seed/24/200"
        },
        {
            "_id": "device_sim5",
            "name": "Smart Lock",
            "type": "Lock",
            "location": "Main Door",
            "api_info": {
                "url": "https://api.example.com/lock",
                "auth_token": "BBBBBBBBBBBBBBBB"
            },
            "category": "Utility",
            "review_status": "Pending",
            "thumbnail_url": "https://picsum.photos/seed/25/200"
        }
    ];
    return JSON.stringify(devices);
};

// Helper function to get the schema based on the entity type
function getSchemaForEntityType(entityTypeString) {
    switch (entityTypeString) {
        case 'websites':
            return websitesSchema;
        case 'contacts':
            return contactsSchema;
        case 'devices':
            return devicesSchema;
        default:
            throw new Error(`Unknown entity type: ${entityTypeString}`);
    }
};

// Function to create a corresponding network entity feedback conversation
async function createNetworkEntityFeedback(networkEntityId, entityTypeString) {
    const functionName = "createNetworkEntityFeedback";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Define the initial network entity feedback structure
        const networkEntityFeedback = {
            "_id": networkEntityId,
            "network_item_category": entityTypeString,
            "time": "",
            "dialogue": [],
            "takeaway": {
                "insight": ""
            }
        };

        // Fetch the existing network feedback document from the database
        const existingFeedback = await localDb.get(feedbackDocId);

        // Append the new network entity feedback to the existing feedback
        existingFeedback.feedback.push(networkEntityFeedback);

        // Update the feedback document in the database
        const response = await localDb.put(existingFeedback);

        log("Exiting function", config.verbosityLevel, 4, functionName);
        return "Network entity feedback created successfully.";
    } catch (error) {
        // Log any errors encountered during the process
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error creating network entity feedback: ' + error.message;
    }
};

// Function to create a new network entity
async function createNetworkEntity(paramsString) {
    const functionName = "createNetworkEntity";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Validate the input parameters
        const validationMessage = validateParams(paramsString);
        if (validationMessage !== 'Params validation successful') {
            throw new Error(validationMessage);
        }

        // Parse the input parameters
        const paramsJson = JSON.parse(paramsString);
        const { entityTypeString, networkEntityJson } = paramsJson;

        // Log the creation process
        log(`Creating a new network entity in ${entityTypeString}`, config.verbosityLevel, 4, functionName);

        // Validate the parsed JSON against the appropriate schema
        const networkEntityString = JSON.stringify(networkEntityJson);
        const validationNetworkMessage = validateNetworkEntity(networkEntityString, entityTypeString);
        if (validationNetworkMessage !== 'Network entity validation successful') {
            // Include schema in the error message for feedback
            const schema = getSchemaForEntityType(entityTypeString);
            return `${validationNetworkMessage}. Be sure to follow this schema: ${JSON.stringify(schema)}`;
        }

        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Check if an entity with the same _id already exists
        if (networkDoc.network.data[entityTypeString].data.some(entity => entity._id === networkEntityJson._id)) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return `Entity with _id ${networkEntityJson._id} already exists in ${entityTypeString}`;
        }

        // Add the new entity to the appropriate section in the network document
        networkDoc.network.data[entityTypeString].data.push(networkEntityJson);

        // Update the network document in the local database
        const response = await localDb.put(networkDoc);

        // Create corresponding network entity feedback conversation
        await createNetworkEntityFeedback(networkEntityJson._id, entityTypeString);

        log("Exiting function", config.verbosityLevel, 4, functionName);

        // Return the response from the database update
        const responseString = JSON.stringify(response);
        return responseString;
    } catch (error) {
        // Log any errors encountered during the process
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error creating network entity: ' + error.message;
    }
};

// Function to get all network entities of the specified type
async function getNetworkEntities(paramsString) {
    const functionName = "getNetworkEntities";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Validate the input parameters
    const validationMessage = validateParams(paramsString);
    if (validationMessage !== 'Params validation successful') {
        throw new Error(validationMessage);
    }

    const paramsJson = JSON.parse(paramsString);
    const { entityTypeString } = paramsJson;

    // Log the retrieval process
    log(`Retrieving all network entities of type ${entityTypeString}`, config.verbosityLevel, 4, functionName);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityTypeString)) {
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return 'Invalid network entity type: ' + entityTypeString;
    }

    try {
        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        log("Exiting function", config.verbosityLevel, 4, functionName);

        // Return the list of entities of the specified type
        const entitiesJson = networkDoc.network.data[entityTypeString].data;
        const entitiesString = JSON.stringify(entitiesJson);
        return entitiesString
    } catch (error) {
        // Log and throw any errors encountered during the fetch
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error fetching network entities: ' + error.message;
    }
};

// Function to retrieve a network entity by ID and type
async function getNetworkEntityById(paramsString) {
    const functionName = "getNetworkEntityById";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Validate the input parameters
    const validationMessage = validateParams(paramsString);
    if (validationMessage !== 'Params validation successful') {
        throw new Error(validationMessage);
    }

    const paramsJson = JSON.parse(paramsString);
    const { entityTypeString, networkEntityJson } = paramsJson;

    // Log the retrieval process
    log(`Getting network entity by ID from ${entityTypeString}`, config.verbosityLevel, 4, functionName);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityTypeString)) {
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return 'Invalid network entity type: ' + entityTypeString;
    }

    // Parse the network entity string into JSON
    const { _id } = networkEntityJson;

    try {
        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Find the network entity by ID
        const networkEntity = networkDoc.network.data[entityTypeString].data.find(entity => entity._id === _id);
        
        // Check if the network entity was found
        if (networkEntity) {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return JSON.stringify(networkEntity);
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);
            return `Network entity with ID ${_id} not found in ${entityTypeString}`;
        }
    } catch (error) {
        // Log and throw any errors encountered during the fetch
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error fetching network entity: ' + error.message;
    }
};

// Function to update a network entity
async function updateNetworkEntity(paramsString) {
    const functionName = "updateNetworkEntity";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Validate the input parameters
    const validationMessage = validateParams(paramsString);
    if (validationMessage !== 'Params validation successful') {
        throw new Error(validationMessage);
    }

    const paramsJson = JSON.parse(paramsString);
    const { entityTypeString, networkEntityJson } = paramsJson;

    // Log the update process
    log(`Updating network entity in ${entityTypeString}`, config.verbosityLevel, 4, functionName);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityTypeString)) {
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return 'Invalid network entity type: ' + entityTypeString;
    }

    try {
        // Validate the parsed JSON against the appropriate schema
        const networkEntityString = JSON.stringify(networkEntityJson);
        const validationNetworkMessage = validateNetworkEntity(networkEntityString, entityTypeString);
        if (validationNetworkMessage !== 'Network entity validation successful') {
            throw new Error(validationNetworkMessage);
        }

        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Find the index of the network entity by ID
        const index = networkDoc.network.data[entityTypeString].data.findIndex(entity => entity._id === networkEntityJson._id);
        
        if (index !== -1) {
            // Update the network entity at the found index
            networkDoc.network.data[entityTypeString].data[index] = networkEntityJson;

            // Update the network document in the local database
            const response = await localDb.put(networkDoc);

            log("Exiting function", config.verbosityLevel, 4, functionName);

            // Return the response from the database update
            const responseString = JSON.stringify({ updated: true, response });
            return responseString;
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);

            return `Network entity with ID ${networkEntityJson._id} not found in ${entityTypeString}`;
        }
    } catch (error) {
        // Log and throw any errors encountered during the process
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error updating network entity: ' + error.message;
    }
};

// Function to delete a corresponding network entity feedback conversation
async function deleteNetworkEntityFeedback(networkEntityId) {
    const functionName = "deleteNetworkEntityFeedback";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
        // Fetch the existing network feedback document from the database
        const existingFeedback = await localDb.get(feedbackDocId);

        // Find the index of the feedback by ID
        const feedbackIndex = existingFeedback.feedback.findIndex(feedback => feedback._id === networkEntityId);

        if (feedbackIndex !== -1) {
            // Remove the feedback from the document
            existingFeedback.feedback.splice(feedbackIndex, 1);

            // Update the feedback document in the database
            await localDb.put(existingFeedback);

            log("Exiting function", config.verbosityLevel, 4, functionName);
        } else {
            // Log if feedback not found, but do not throw an error
            log(`Feedback with ID ${networkEntityId} not found`, config.verbosityLevel, 4, functionName);
        }
    } catch (error) {
        // Log any errors encountered during the process
        log(error, config.verbosityLevel, 1, functionName);
        // Ignore the error if the feedback ID does not exist
    }
};

// Function to delete a network entity
async function deleteNetworkEntity(paramsString) {
    const functionName = "deleteNetworkEntity";
    log("Entering function", config.verbosityLevel, 4, functionName);

    // Validate the input parameters
    const validationMessage = validateParams(paramsString);
    if (validationMessage !== 'Params validation successful') {
        throw new Error(validationMessage);
    }

    // Parse the input parameters
    const paramsJson = JSON.parse(paramsString);
    const { entityTypeString, networkEntityJson } = paramsJson;
    const { _id } = networkEntityJson; // Extract _id from networkEntityJson

    // Log the deletion process
    log(`Deleting network entity from ${entityTypeString}`, config.verbosityLevel, 4, functionName);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityTypeString)) {
        log("Exiting function", config.verbosityLevel, 4, functionName);
        return 'Invalid network entity type: ' + entityTypeString;
    }

    try {
        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Find the index of the network entity by ID
        const index = networkDoc.network.data[entityTypeString].data.findIndex(entity => entity._id === _id);

        if (index !== -1) {
            // Remove the network entity from the document
            networkDoc.network.data[entityTypeString].data.splice(index, 1);

            // Update the network document in the local database
            const response = await localDb.put(networkDoc);

            // Delete the corresponding network entity feedback
            await deleteNetworkEntityFeedback(_id);

            log("Exiting function", config.verbosityLevel, 4, functionName);

            // Return the response from the database update
            const responseString = JSON.stringify({ deleted: true, response });
            return responseString;
        } else {
            log("Exiting function", config.verbosityLevel, 4, functionName);

            // Return an error message if the network entity is not found
            return `Network entity with ID ${_id} not found in ${entityTypeString}`;
        }
    } catch (error) {
        // Log and throw any errors encountered during the process
        log(error, config.verbosityLevel, 1, functionName);
        return 'Error deleting network entity: ' + error.message;
    }
};

const networkTools = [
    {
        name: "Create A Network Entity",
        func: createNetworkEntity,
        description: `Creates a new network entity (after validating its schema) and inserts it into the database.
                      Requires as input a JSON string that has a schema of ${paramsSchema}.
                      The 'entityTypeString' must be one of ${validEntityTypes.join(', ')}.
                      The 'networkEntityJson' of a new website must adhere to the ${websitesSchema} schema.
                      The 'networkEntityJson' of a new contact must adhere to the ${contactsSchema} schema.
                      The 'networkEntityJson' of a new device must adhere to the ${devicesSchema} schema.`
    },
    {
        name: "Retrieve All Network Entities",
        func: getNetworkEntities,
        description: `Retrieves all network entities of a specified type from the database. 
                      Requires as input a JSON string that has a schema of ${paramsSchema}.
                      The 'entityTypeString' indicates the type of network entity to retreive and must be one of ${validEntityTypes.join(', ')}.
                      The 'networkEntityJson' should be {}.
                      Returns a JSON array of all entities.`
    },
    {
        name: "Retrieve Network Entity by ID",
        func: getNetworkEntityById,
        description: `Retrieves a specific network entity based on its ID from the specified network entity JSON.
                      Requires as input a JSON string that has a schema of ${paramsSchema}.
                      The 'entityTypeString' must be one of ${validEntityTypes.join(', ')}.
                      The 'networkEntityJson' must adhere to one of the following schemas: ${websitesSchema}, ${contactsSchema}, or ${devicesSchema}.
                      Returns a JSON object of the network entity that corresponds to the category given in entityTypeString and _id given in networkEntityJson.`
    },
    {
        name: "Update Network Entity",
        func: updateNetworkEntity,
        description: `Updates an existing network entity after validating its schema. 
                      Requires as input a JSON string that has a schema of ${paramsSchema}.
                      The 'entityTypeString' must be one of ${validEntityTypes.join(', ')}.
                      The 'entityTypeString' must be one of ${validEntityTypes.join(', ')}.
                      The 'networkEntityJson' of an updated website must adhere to the ${websitesSchema} schema.
                      The 'networkEntityJson' of an updated contact must adhere to the ${contactsSchema} schema.
                      The 'networkEntityJson' of an updated device must adhere to the ${devicesSchema} schema.
                      Updates the network entity that corresponds to the category given in entityTypeString and _id given in networkEntityJson.`
    },
    {
        name: "Delete Network Entity",
        func: deleteNetworkEntity,
        description: `Deletes a network entity from the database based on its ID. 
                      Requires as input a JSON string that has a schema of ${paramsSchema}.
                      The 'entityTypeString' must be one of ${validEntityTypes.join(', ')}.
                      The 'networkEntityJson' must adhere to one of the following schemas: ${websitesSchema}, ${contactsSchema}, or ${devicesSchema}.
                      Deletes the network entity that corresponds to the category given in entityTypeString and _id given in networkEntityJson.`
    },
    {
        name: "Get Potential Contacts",
        func: getPotentialContacts,
        description: `Returns a list of potential contacts that can be added to the network. 
                      Requires no input parameters.`
    },
    {
        name: "Get Potential Devices",
        func: getPotentialDevices,
        description: `Returns a list of potential devices that can be added to the network. 
                      Requires no input parameters.`
    }
];

const updateNetworkPrompt = aiConfig.aiUpdateNetwork;

// Test function for validateNetworkEntity
function testValidateNetworkEntity() {
    const validWebsite = JSON.stringify({
        "_id": "website1",
        "url": "https://example.com",
        "description": "Example website",
        "usefulness_description": "Provides example content",
        "category": "Research & Reference",
        "review_status": "Pending",
        "thumbnail_url": "https://picsum.photos/seed/11/200"
    });

    // Invalid input missing required fields
    const invalidWebsite = JSON.stringify({});

    console.log("Testing validateNetworkEntity with valid input:");
    try {
        // Validate a correctly structured network entity
        validateNetworkEntity(validWebsite, 'websites');
        console.log('Network entity schema validation successful.');
    } catch (error) {
        console.error(error.message);
    }

    console.log("Testing validateNetworkEntity with invalid input:");
    try {
        // Attempt to validate an incorrectly structured network entity
        validateNetworkEntity(invalidWebsite, 'websites');
        console.log(validateNetworkEntity(invalidWebsite, 'websites')); // Should log that validation failed
    } catch (error) {
        console.error(error.message);
    }
};

// Test function for validateParams
function testValidateParams() {
    // Define a valid params object
    const validParams = {
        entityTypeString: "websites",
        networkEntityJson: {
            "_id": "website1",
            "url": "https://example.com",
            "description": "Example website",
            "usefulness_description": "Provides example content",
            "category": "Research & Reference",
            "review_status": "Pending",
            "thumbnail_url": "https://picsum.photos/seed/11/200"
        }
    };

    // Define an invalid params object missing networkEntityJson
    const invalidParams = {
        entityTypeString: "websites"
        // networkEntityJson is missing
    };

    // Test with valid params
    console.log("Testing validateParams with valid input:");
    try {
        // Validate a correctly structured params object
        const validParamsString = JSON.stringify(validParams);
        validateParams(validParamsString);
        console.log(validateParams(validParamsString));
    } catch (error) {
        console.error(error.message);
    }

    // Test with invalid params
    console.log("Testing validateParams with invalid input:");
    try {
        // Attempt to validate an incorrectly structured params object
        const invalidParamsString = JSON.stringify(invalidParams);
        console.log(validateParams(invalidParamsString)); // Should log that validation failed
    } catch (error) {
        console.error(error.message);
    }
};

// Test function for createNetworkEntity
async function testCreateNetworkEntity() {
    const validWebsiteJson = {
        "_id": "website_test1",
        "url": "https://example-test.com",
        "description": "Example test website",
        "usefulness_description": "Provides test content",
        "category": "Research & Reference",
        "review_status": "Pending",
        "thumbnail_url": "https://picsum.photos/id/445/200"
    };

    const paramsJson = {
        entityTypeString: "websites",
        networkEntityJson: validWebsiteJson
    };

    const paramsString = JSON.stringify(paramsJson);

    console.log("Creating a new network entity:");
    try {
        // Attempt to create a new network entity
        const createResult = await createNetworkEntity(paramsString);
        console.log('Network entity created successfully:', createResult);

        // Verify the entity was actually created by checking its existence
        const verifyParamsJson = {
            entityTypeString: "websites",
            networkEntityJson: { _id: "website_test1" }
        };
        const verifyParamsString = JSON.stringify(verifyParamsJson);

        const createdEntity = await getNetworkEntityById(verifyParamsString);
        console.log('Verified created entity:', createdEntity);
    } catch (error) {
        console.error('Error creating network entity:', error.message);
    }

    console.log("Attempting to create a network entity with an existing ID:");
    try {
        // Attempt to create a network entity with the same ID
        const duplicateCreateResult = await createNetworkEntity(paramsString);
        console.log('Network entity created successfully:', duplicateCreateResult);
    } catch (error) {
        // Expected to fail because the ID already exists
        console.error('Error creating network entity with existing ID:', error.message);
    }
};

// Test function for getNetworkEntities
async function testGetNetworkEntities() {
    const paramsJson = {
        entityTypeString: "websites",
        networkEntityJson: {}
    };
    const paramsString = JSON.stringify(paramsJson);

    console.log("Retrieving all network entities of type 'websites':");
    try {
        // Retrieve all network entities of the specified type
        const entities = await getNetworkEntities(paramsString);
        console.log('Retrieved entities:', entities);
    } catch (error) {
        console.error('Error retrieving network entities:', error.message);
    }
};

// Test function for getNetworkEntityById
async function testGetNetworkEntityById() {
    const paramsJson = {
        entityTypeString: "websites",
        // JSON string containing the ID of the network entity to retrieve
        networkEntityJson: { _id: "website_test1" }
    };
    const paramsString = JSON.stringify(paramsJson);

    console.log("Retrieving network entity by ID:");
    try {
        // Retrieve a specific network entity by its ID
        const entity = await getNetworkEntityById(paramsString);
        console.log('Retrieved entity:', entity);
    } catch (error) {
        console.error('Error retrieving network entity by ID:', error.message);
    }
};

// Test function for updateNetworkEntity
async function testUpdateNetworkEntity() {
    const updatedWebsiteJson = {
        "_id": "website_test1",
        "url": "https://example-test-updated.com",
        "description": "Updated example test website",
        "usefulness_description": "Provides updated test content",
        "category": "Research & Reference",
        "review_status": "Reviewed",
        "thumbnail_url": "https://picsum.photos/id/445/200"
    };

    const paramsJson = {
        entityTypeString: "websites",
        networkEntityJson: updatedWebsiteJson
    };
    const paramsString = JSON.stringify(paramsJson);

    console.log("Updating network entity:");
    try {
        // Attempt to update an existing network entity
        const updateResult = await updateNetworkEntity(paramsString);
        console.log('Network entity updated successfully:', updateResult);
    } catch (error) {
        console.error('Error updating network entity:', error.message);
    }

    const nonExistentWebsiteJson = {
        "_id": "non_existent_website",
        "url": "https://non-existent.com",
        "description": "Non-existent website",
        "usefulness_description": "Does not exist",
        "category": "Research & Reference",
        "review_status": "Pending",
        "thumbnail_url": "https://picsum.photos/id/445/200"
    };

    const nonExistentParamsJson = {
        entityTypeString: "websites",
        networkEntityJson: nonExistentWebsiteJson
    };
    const nonExistentParamsString = JSON.stringify(nonExistentParamsJson);

    console.log("Attempting to update a non-existent network entity:");
    try {
        // Attempt to update a network entity that does not exist
        const nonExistentUpdateResult = await updateNetworkEntity(nonExistentParamsString);
        console.log('Network entity updated successfully:', nonExistentUpdateResult);
    } catch (error) {
        // Expected to fail because the entity does not exist
        console.error('Error updating non-existent network entity:', error.message);
    }
};

// Test function for deleteNetworkEntity
async function testDeleteNetworkEntity() {
    const websiteToDelete = {
        "_id": "website_test1",
        "url": "https://example-test-updated.com",
        "description": "Updated example test website",
        "usefulness_description": "Provides updated test content",
        "category": "Research & Reference",
        "review_status": "Reviewed",
        "thumbnail_url": "https://picsum.photos/id/445/200"
    };

    const paramsJson = {
        entityTypeString: "websites",
        networkEntityJson: websiteToDelete
    };
    const paramsString = JSON.stringify(paramsJson);

    console.log("Deleting network entity:");
    try {
        // Attempt to delete an existing network entity
        const deleteResult = await deleteNetworkEntity(paramsString);
        console.log('Network entity deleted successfully:', deleteResult);
    } catch (error) {
        console.error('Error deleting network entity:', error.message);
    }

    const nonExistentWebsite = {
        "_id": "non_existent_website",
        "url": "https://non-existent.com",
        "description": "Non-existent website",
        "usefulness_description": "Does not exist",
        "category": "Research & Reference",
        "review_status": "Pending",
        "thumbnail_url": "https://picsum.photos/id/445/200"
    };

    const nonExistentParamsJson = {
        entityTypeString: "websites",
        networkEntityJson: nonExistentWebsite
    };
    const nonExistentParamsString = JSON.stringify(nonExistentParamsJson);

    console.log("Attempting to delete a non-existent network entity:");
    try {
        // Attempt to delete a network entity that does not exist
        const nonExistentDeleteResult = await deleteNetworkEntity(nonExistentParamsString);
        console.log('Network entity deleted successfully:', nonExistentDeleteResult);
    } catch (error) {
        // Expected to fail because the entity does not exist
        console.error('Error deleting non-existent network entity:', error.message);
    }
};

// Test harness that runs all test functions
async function runNetworkUtilsTestSuite() {
    testValidateNetworkEntity();
    testValidateParams();
    await testCreateNetworkEntity();
    await testGetNetworkEntities();
    await testGetNetworkEntityById();
    await testUpdateNetworkEntity();
    await testDeleteNetworkEntity();
};


// Export CRUD functions and tools for the network data
export {
    runNetworkUtilsTestSuite,
    validateNetworkEntity,
    createNetworkEntity,
    getNetworkEntities,
    getNetworkEntityById,
    updateNetworkEntity,
    deleteNetworkEntity,
    networkTools,
    updateNetworkPrompt
};
