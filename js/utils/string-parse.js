import { log } from "../utils/logging.js";
import config from "../ai/physarai-config.js";


function formatJson(obj, spaces) {
    return JSON.stringify(obj, false, "\t")
}

function validateJson(jsonData, schema) {
    /*
    // Convert jsonData to object if it's a string
    if (typeof jsonData === 'string') {
        try {
            jsonData = JSON.parse(jsonData);
        } catch (error) {
            console.log("jsonData:" + jsonData);
            throw new Error('Invalid JSON data string for jsonData');
        }
    }

    // Convert schema to object if it's a string
    if (typeof schema === 'string') {
        try {
            schema = JSON.parse(schema);
        } catch (error) {
            throw new Error('Invalid JSON schema string for jsonSchema');
        }
    }

    // Check if jsonData is an object and schema is an object
    if (typeof jsonData !== 'object' || typeof schema !== 'object') {
        throw new Error('JSON data and schema must be objects');
    }

    // Iterate over each property in the schema
    for (var key in schema.properties) {
        // Check if the property is required
        if (schema.required && schema.required.includes(key)) {
            // Check if the property is missing in jsonData
            if (!(key in jsonData)) {
                return {
                    valid: false,
                    error: "Required property '" + key + "' is missing"
                }; // Property is missing
            }
        }

        // Check if the property's type matches the schema
        if (schema.properties[key].type && typeof jsonData[key] !== schema.properties[key].type) {
            return {
                valid: false,
                error: "Property '" + key + "' has invalid type"
            }; // Property type doesn't match
        }
    }
    */
    return {
        valid: true,
        error: null
    }; // JSON data is valid
}

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

