function formatJson(obj, spaces) {
    return JSON.stringify(obj, false, "\t")
}

function validateJson(jsonData, schema) {
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

    return {
        valid: true,
        error: null
    }; // JSON data is valid
}

export {formatJson, validateJson}
