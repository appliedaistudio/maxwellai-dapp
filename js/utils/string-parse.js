import { log } from "../utils/logging.js";
import config from "../ai/physarai-config.js";


function formatJson(obj, spaces) {
    return JSON.stringify(obj, false, "\t")
}

function validateJson(jsonData, schema) {
    // Check if jsonData is a string and parse it into an object
    if (typeof jsonData === 'string') {
        try {
            jsonData = JSON.parse(jsonData);
        } catch (error) {
            console.log("jsonData:" + jsonData);
            throw new Error('Invalid JSON data string for jsonData');
        }
    }

    // Check if schema is a string and parse it into an object
    if (typeof schema === 'string') {
        try {
            schema = JSON.parse(schema);
        } catch (error) {
            throw new Error('Invalid JSON schema string for jsonSchema');
        }
    }

    // Validate that both jsonData and schema are objects
    if (typeof jsonData !== 'object' || typeof schema !== 'object') {
        throw new Error('JSON data and schema must be objects');
    }

    // Iterate over each property defined in the schema
    for (var key in schema.properties) {
        // Check for required properties in jsonData
        if (schema.required && schema.required.includes(key)) {
            if (!(key in jsonData)) {
                return { valid: false, error: "Required property '" + key + "' is missing" };
            }
        }

        // Handle array properties in jsonData according to the schema
        if (schema.properties[key].type === 'array' && Array.isArray(jsonData[key])) {
            let itemSchema = schema.properties[key].items;
            // Validate each item in the array
            for (let item of jsonData[key]) {
                for (let prop in itemSchema.properties) {
                    // Check for required properties within each item
                    if (itemSchema.required.includes(prop) && !(prop in item)) {
                        return { valid: false, error: "Missing required property '" + prop + "' in an item of '" + key + "'" };
                    }
                    // Special handling for 'Action Input' which can be string or object
                    if (prop === 'Action Input') {
                        if (!(typeof item[prop] === 'string' || (typeof item[prop] === 'object' && item[prop] !== null && !Array.isArray(item[prop])))) {
                            return { valid: false, error: `Invalid type for property '${prop}' in an item of '${key}', expected string or object` };
                        }
                    } else if (typeof item[prop] !== itemSchema.properties[prop].type) {
                        return { valid: false, error: `Invalid type for property '${prop}' in an item of '${key}', expected ${itemSchema.properties[prop].type}` };
                    }
                }
            }
        } else if (typeof jsonData[key] !== schema.properties[key].type) {
            // Validate type of non-array properties
            return { valid: false, error: `Property '${key}' has invalid type, expected ${schema.properties[key].type}` };
        }
    }
    // Return valid if all checks pass
    return { valid: true, error: null };
};

function removeNonAlphanumeric(text) {
    const functionName = "removeNonAlphanumeric";

    log("Entering removeNonAlphanumeric function", config.verbosityLevel, 4, functionName); // Log function entry with verbosity level 4
    log("Input text:", config.verbosityLevel, 4, functionName); // Log input text with verbosity level 4
    log(text, config.verbosityLevel, 4, functionName); // Log input text with verbosity level 4
    let result = '';
    for (let char of text) {
        // Check if the character is alphanumeric or a space
        if (/[a-zA-Z0-9\s]/.test(char)) {
            result += char;
        }
    }
    log("Output text:", config.verbosityLevel, 4, functionName); // Log output text with verbosity level 4
    log(result, config.verbosityLevel, 4, functionName); // Log output text with verbosity level 4
    log("Exiting removeNonAlphanumeric function", config.verbosityLevel, 4, functionName); // Log function exit with verbosity level 4
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

export {formatJson, validateJson, removeNonAlphanumeric, removeCharacter, replaceCharacter}

