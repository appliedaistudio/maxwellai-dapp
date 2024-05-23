import { log } from "../utils/logging.js";
import { aiConfig } from "../ai/physarai/physarai-config.js";


function formatJson(obj, spaces) {
    return JSON.stringify(obj, false, "\t")
}

function validateJson(jsonData, schema) {
    // Check if jsonData is a string and attempt to parse it into an object
    if (typeof jsonData === 'string') {
        try {
            jsonData = JSON.parse(jsonData);
        } catch (error) {
            throw new Error('Invalid JSON data string for jsonData');
        }
    }

    // Check if schema is a string and attempt to parse it into an object
    if (typeof schema === 'string') {
        try {
            schema = JSON.parse(schema);
        } catch (error) {
            throw new Error('Invalid JSON schema string for jsonSchema');
        }
    }

    // Ensure that both jsonData and schema are objects before proceeding
    if (typeof jsonData !== 'object' || typeof schema !== 'object') {
        throw new Error('JSON data and schema must be objects');
    }

    // Iterate through each property in the schema to perform validation
    for (var key in schema.properties) {
        // Ensure required properties are present in jsonData
        if (schema.required && schema.required.includes(key)) {
            if (!(key in jsonData)) {
                return { valid: false, error: "Required property '" + key + "' is missing" };
            }
        }

        // Check for const values
        if (schema.properties[key].hasOwnProperty('const')) {
            if (jsonData[key] !== schema.properties[key]['const']) {
                return { valid: false, error: `Property '${key}' must have the constant value ${schema.properties[key]['const']}` };
            }
        }

        // Validate properties that are arrays according to the schema
        if (schema.properties[key].type === 'array' && Array.isArray(jsonData[key])) {
            let itemSchema = schema.properties[key].items;
            for (let item of jsonData[key]) {
                // Validate each property in the array items according to the item schema
                for (let prop in itemSchema.properties) {
                    if (itemSchema.required && itemSchema.required.includes(prop) && !(prop in item)) {
                        return { valid: false, error: "Missing required property '" + prop + "' in an item of '" + key + "'" };
                    }

                    // Check for the 'anyOf' condition to allow multiple possible types
                    if (itemSchema.properties[prop].hasOwnProperty('anyOf')) {
                        let validType = itemSchema.properties[prop].anyOf.some(typeSpec => typeof item[prop] === typeSpec.type);
                        if (!validType) {
                            return { valid: false, error: `Invalid type for property '${prop}' in an item of '${key}', expected one of the specified types in anyOf` };
                        }
                    } else if (typeof item[prop] !== itemSchema.properties[prop].type) {
                        return { valid: false, error: `Invalid type for property '${prop}' in an item of '${key}', expected ${itemSchema.properties[prop].type}` };
                    }
                }
            }
        } else if (key in jsonData && typeof jsonData[key] !== schema.properties[key].type) {
            // Validate the type of non-array properties against the schema definition
            return { valid: false, error: `Property '${key}' has invalid type, expected ${schema.properties[key].type}` };
        }
    }

    // If all validations pass, return that the data is valid
    return { valid: true, error: null };
};

function removeNonAlphanumeric(text) {
    const functionName = "removeNonAlphanumeric";

    log("Entering removeNonAlphanumeric function", config.verbosityLevel, 4, functionName); // Log function entry with verbosity level 4
    log("Input text:", aiConfig.verbosityLevel, 4, functionName); // Log input text with verbosity level 4
    log(text, aiConfig.verbosityLevel, 4, functionName); // Log input text with verbosity level 4
    let result = '';
    for (let char of text) {
        // Check if the character is alphanumeric or a space
        if (/[a-zA-Z0-9\s]/.test(char)) {
            result += char;
        }
    }
    log("Output text:", aiConfig.verbosityLevel, 4, functionName); // Log output text with verbosity level 4
    log(result, aiConfig.verbosityLevel, 4, functionName); // Log output text with verbosity level 4
    log("Exiting removeNonAlphanumeric function", aiConfig.verbosityLevel, 4, functionName); // Log function exit with verbosity level 4
    return result;
};

function removeCharacter(str, charToRemove) {
    // Escape special characters in the input character
    const escapedChar = charToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Create a regular expression to match the input character globally
    const regex = new RegExp(escapedChar, 'g');
    // Use replace() to remove all occurrences of the character
    return str.replace(regex, '');
}

function replaceCharacter(str, charToReplace, replacementChar) {
    const regex = new RegExp(charToReplace, 'g');
    return str.replace(regex, replacementChar);
}

// Helper function to strip out the ```json wrapper and return the JSON content
function stripJsonWrapper(response) {
    if (response === null) {
        return null;
    }
    if (response.startsWith("```json") && response.endsWith("```")) {
        return response.substring(7, response.length - 3).trim();
    }
    return response;
};

export {formatJson, validateJson, removeNonAlphanumeric, removeCharacter, replaceCharacter, stripJsonWrapper}

