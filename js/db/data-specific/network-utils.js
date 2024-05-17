import config from "../../dapp-config.js";
import aiConfig from "../../ai/physarai/physarai-config.js";
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
        "thumbnail_url": { "type": "string", "format": "uri" }
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
        "thumbnail_url": { "type": "string", "format": "uri" }
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
        "thumbnail_url": { "type": "string", "format": "uri" }
    },
    "required": ["_id", "name", "type", "location", "api_info", "category", "review_status", "thumbnail_url"]
};

// Define the schema for params
const paramsSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Params",
    "type": "object",
    "properties": {
        "entityType": {
            "type": "string",
            "enum": ["websites", "contacts", "devices"]
        },
        "networkEntityString": {
            "type": "string"
        }
    },
    "required": ["entityType", "networkEntityString"]
};

// Function to validate a network entity against the JSON schema
function validateNetworkEntity(networkEntityString, entityType) {
    // Check if the entityType is valid
    if (!validEntityTypes.includes(entityType)) {
        throw new Error('Invalid network entity type: ' + entityType);
    }

    const entitySchema = entitySchemas[entityType];

    try {
        // Parse the network entity string into JSON
        const networkEntity = JSON.parse(networkEntityString);

        // Validate the parsed JSON against the selected schema
        const validationResult = validateJson(networkEntity, entitySchema);

        // Check if validation failed and throw an error if it did
        if (!validationResult.valid) {
            throw new Error('Network entity schema validation failed: ' + validationResult.error);
        }
    } catch (error) {
        // Handle JSON parsing errors
        throw new Error('Error parsing JSON: ' + error.message);
    }
};

// Function to validate params against the schema
function validateParams(params) {
    const validationResult = validateJson(params, paramsSchema);
    if (!validationResult.valid) {
        throw new Error('Params validation failed: ' + validationResult.error);
    }
};

// Define a collection of schemas for each entityType
const entitySchemas = {
    websites: websitesSchema,
    contacts: contactsSchema,
    devices: devicesSchema
};

// Initialize document ID for the network data
const networkDocId = 'maxwellai_network';

// Initialize PouchlocalDb instance with the specified database name for networks
const localDb = new PouchDB(config.localDbName);

// Function to get a list of potential contacts
function getPotentialContacts() {
    // Return a list of simulated potential contacts
    return [
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
};

// Function to get a list of potential devices
function getPotentialDevices() {
    // Return a list of simulated potential devices
    return [
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
};

// Function to create a new network entity
async function createNetworkEntity(params) {
    // Validate the input parameters
    validateParams(params);

    const { entityType, networkEntityString } = params;

    // Log the creation process
    console.log(`Creating a new network entity in ${entityType}`);

    try {
        // Parse the network entity string into JSON
        const networkEntityJson = JSON.parse(networkEntityString);

        // Validate the parsed JSON against the appropriate schema
        validateNetworkEntity(networkEntityJson, entityType);

        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Check if an entity with the same _id already exists
        if (networkDoc.data[entityType].data.some(entity => entity._id === networkEntityJson._id)) {
            throw new Error(`Entity with _id ${networkEntityJson._id} already exists in ${entityType}`);
        }

        // Add the new entity to the appropriate section in the network document
        networkDoc.data[entityType].data.push(networkEntityJson);

        // Update the network document in the local database
        const response = await localDb.put(networkDoc);

        // Return the response from the database update
        return response;
    } catch (error) {
        // Log any errors encountered during the process
        log(error, config.verbosityLevel, 3, 'createNetworkEntity');
        throw new Error('Error creating network entity: ' + error.message);
    }
};

// Function to get all network entities of the specified type
async function getNetworkEntities(params) {
    // Validate the input parameters
    validateParams(params);

    const { entityType } = params;

    // Log the retrieval process
    console.log(`Retrieving all network entities of type ${entityType}`);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityType)) {
        throw new Error('Invalid network entity type: ' + entityType);
    }

    try {
        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Return the list of entities of the specified type
        return networkDoc.data[entityType].data;
    } catch (error) {
        // Log and throw any errors encountered during the fetch
        log(error, config.verbosityLevel, 3, 'getNetworkEntities');
        throw new Error('Error fetching network entities: ' + error.message);
    }
};

// Function to retrieve a network entity by ID and type
async function getNetworkEntityById(params) {
    // Validate the input parameters
    validateParams(params);

    const { entityType, networkEntityString } = params;

    // Log the retrieval process
    console.log(`Getting network entity by ID from ${entityType}`);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityType)) {
        throw new Error('Invalid network entity type: ' + entityType);
    }

    // Parse the network entity string into JSON
    const networkEntityJson = JSON.parse(networkEntityString);
    const { _id } = networkEntityJson;

    try {
        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Find the network entity by ID
        const networkEntity = networkDoc.data[entityType].data.find(entity => entity._id === _id);
        
        // Check if the network entity was found
        if (networkEntity) {
            return networkEntity;
        } else {
            throw new Error(`Network entity with ID ${_id} not found in ${entityType}`);
        }
    } catch (error) {
        // Log and throw any errors encountered during the fetch
        log(error, config.verbosityLevel, 3, 'getNetworkEntityById');
        throw new Error('Error fetching network entity: ' + error.message);
    }
};

// Function to update a network entity
async function updateNetworkEntity(params) {
    // Validate the input parameters
    validateParams(params);

    const { entityType, networkEntityString } = params;

    // Log the update process
    console.log(`Updating network entity in ${entityType}`);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityType)) {
        throw new Error('Invalid network entity type: ' + entityType);
    }

    try {
        // Parse the network entity string into JSON
        const networkEntityJson = JSON.parse(networkEntityString);

        // Validate the parsed JSON against the appropriate schema
        validateNetworkEntity(networkEntityString, entityType);

        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Find the index of the network entity by ID
        const index = networkDoc.data[entityType].data.findIndex(entity => entity._id === networkEntityJson._id);
        
        if (index !== -1) {
            // Update the network entity at the found index
            networkDoc.data[entityType].data[index] = networkEntityJson;

            // Update the network document in the local database
            const response = await localDb.put(networkDoc);

            // Return the response from the database update
            return { updated: true, response };
        } else {
            throw new Error(`Network entity with ID ${networkEntityJson._id} not found in ${entityType}`);
        }
    } catch (error) {
        // Log and throw any errors encountered during the process
        log(error, config.verbosityLevel, 3, 'updateNetworkEntity');
        throw new Error('Error updating network entity: ' + error.message);
    }
};

// Function to delete a network entity
async function deleteNetworkEntity(params) {
    // Validate the input parameters
    validateParams(params);

    const { entityType, id } = params;

    // Log the deletion process
    console.log(`Deleting network entity from ${entityType}`);

    // Check if the entity type is valid
    if (!validEntityTypes.includes(entityType)) {
        throw new Error('Invalid network entity type: ' + entityType);
    }

    try {
        // Fetch the network document from the local database
        const networkDoc = await localDb.get(networkDocId);

        // Find the index of the network entity by ID
        const index = networkDoc.data[entityType].data.findIndex(entity => entity._id === id);

        if (index !== -1) {
            // Remove the network entity from the document
            networkDoc.data[entityType].data.splice(index, 1);

            // Update the network document in the local database
            const response = await localDb.put(networkDoc);

            // Return the response from the database update
            return { deleted: true, response };
        } else {
            // Throw an error if the network entity is not found
            throw new Error(`Network entity with ID ${id} not found in ${entityType}`);
        }
    } catch (error) {
        // Log and throw any errors encountered during the process
        log(error, config.verbosityLevel, 3, 'deleteNetworkEntity');
        throw new Error('Error deleting network entity: ' + error.message);
    }
};

const networkTools = [
    {
        name: "Network Entity JSON Schema Validation",
        func: validateNetworkEntity,
        description: `Validates the data of a network entity against a JSON schema to ensure conformity before performing CRUD operations. 
                      Requires a JSON string representing a network entity as input and the entity type (one of ${validEntityTypes.join(', ')}). 
                      The input must adhere to the schema corresponding to the specified entity type: 'websitesSchema', 'contactsSchema', or 'devicesSchema'.`
    },
    {
        name: "Create A Network Entity",
        func: createNetworkEntity,
        description: `Creates a new network entity after validating its schema and inserts it into the database. 
                      Requires a JSON object with 'entityType' specifying the type of entity (one of ${validEntityTypes.join(', ')}), 
                      and 'networkEntityString' containing the network entity data as a JSON string. 
                      The input must adhere to the schema corresponding to the specified entity type: ${websitesSchema}, ${contactsSchema}, or ${devicesSchema}.`
    },
    {
        name: "Retrieve All Network Entities",
        func: getNetworkEntities,
        description: `Retrieves all network entities of a specified type from the database. 
                      Requires a JSON object with 'entityType' specifying the type of entity (one of ${validEntityTypes.join(', ')}). 
                      The input schema is ${paramsSchema}, which includes the 'entityType'. 
                      Returns a JSON array of all entities.`
    },
    {
        name: "Retrieve Network Entity by ID",
        func: getNetworkEntityById,
        description: `Retrieves a specific network entity based on its ID from the specified entity type. 
                      Requires a JSON object with 'entityType' and 'networkEntityString' containing the ID of the network entity as a JSON string. 
                      The input schema is ${paramsSchema}, which includes the 'entityType' and 'networkEntityString'.`
    },
    {
        name: "Update Network Entity",
        func: updateNetworkEntity,
        description: `Updates an existing network entity after validating its schema. 
                      Requires a JSON object with 'entityType' specifying the type of entity (one of ${validEntityTypes.join(', ')}), 
                      and 'networkEntityString' containing the updated network entity data as a JSON string. 
                      The input must adhere to the schema corresponding to the specified entity type: ${websitesSchema}, ${contactsSchema}, or ${devicesSchema}.`
    },
    {
        name: "Delete Network Entity",
        func: deleteNetworkEntity,
        description: `Deletes a network entity from the database based on its ID. 
                      Requires a JSON object with 'entityType' and 'id' specifying the type and ID of the entity to be deleted. 
                      The input schema is ${paramsSchema}, which includes the 'entityType' and 'id'.`
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
    } catch (error) {
        // Expected to fail
        console.error(error.message);
    }
};

// Test function for createNetworkEntity
async function testCreateNetworkEntity() {
    const validWebsite = JSON.stringify({
        "_id": "website_test1",
        "url": "https://example-test.com",
        "description": "Example test website",
        "usefulness_description": "Provides test content",
        "category": "Research & Reference",
        "review_status": "Pending",
        "thumbnail_url": "https://picsum.photos/seed/12/200"
    });

    // Parameters for creating a network entity
    const params = {
        entityType: "websites",
        networkEntityString: validWebsite
    };

    console.log("Creating a new network entity:");
    try {
        // Attempt to create a new network entity
        const createResult = await createNetworkEntity(params);
        console.log('Network entity created successfully:', createResult);
    } catch (error) {
        console.error('Error creating network entity:', error.message);
    }
};

// Test function for getNetworkEntities
async function testGetNetworkEntities() {
    const params = {
        entityType: "websites"
    };

    console.log("Retrieving all network entities of type 'websites':");
    try {
        // Retrieve all network entities of the specified type
        const entities = await getNetworkEntities(params);
        console.log('Retrieved entities:', entities);
    } catch (error) {
        console.error('Error retrieving network entities:', error.message);
    }
};

// Test function for getNetworkEntityById
async function testGetNetworkEntityById() {
    const params = {
        entityType: "websites",
        // JSON string containing the ID of the network entity to retrieve
        networkEntityString: JSON.stringify({ _id: "website_test1" })
    };

    console.log("Retrieving network entity by ID:");
    try {
        // Retrieve a specific network entity by its ID
        const entity = await getNetworkEntityById(params);
        console.log('Retrieved entity:', entity);
    } catch (error) {
        console.error('Error retrieving network entity by ID:', error.message);
    }
};

// Test function for updateNetworkEntity
async function testUpdateNetworkEntity() {
    const updatedWebsite = JSON.stringify({
        "_id": "website_test1",
        "url": "https://example-test-updated.com",
        "description": "Updated example test website",
        "usefulness_description": "Provides updated test content",
        "category": "Research & Reference",
        "review_status": "Reviewed",
        "thumbnail_url": "https://picsum.photos/seed/13/200"
    });

    // Parameters for updating a network entity
    const params = {
        entityType: "websites",
        networkEntityString: updatedWebsite
    };

    console.log("Updating network entity:");
    try {
        // Attempt to update an existing network entity
        const updateResult = await updateNetworkEntity(params);
        console.log('Network entity updated successfully:', updateResult);
    } catch (error) {
        console.error('Error updating network entity:', error.message);
    }
};

// Test function for deleteNetworkEntity
async function testDeleteNetworkEntity() {
    const params = {
        entityType: "websites",
        // ID of the network entity to delete
        id: "website_test1"
    };

    console.log("Deleting network entity:");
    try {
        // Attempt to delete a network entity
        const deleteResult = await deleteNetworkEntity(params);
        console.log('Network entity deleted successfully:', deleteResult);
    } catch (error) {
        console.error('Error deleting network entity:', error.message);
    }
};

// Test harness that runs all test functions
async function runNetworkUtilsTestSuite() {
    testValidateNetworkEntity();
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
};
