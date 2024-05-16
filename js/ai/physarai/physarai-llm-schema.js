import { validateJson } from '../../utils/string-parse.js';

const llmResponseSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "Thought": {
            "type": "string",
            "description": "The LLM's initial consideration or strategy before taking action."
        },
        "Actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "Action": {
                        "type": "string",
                        "description": "The name of the action to be taken, which could be a tool name or 'Response To Human'."
                    },
                    "Action Input": {
                        "anyOf": [
                            { "type": "string" },
                            { "type": "object" }
                        ],
                        "description": "The specific input or command given to the tool, or the response to be conveyed to the human. Can be a string or JSON object."
                    }
                },
                "required": ["Action", "Action Input"],
                "additionalProperties": false
            },
            "minItems": 1,
            "description": "A list of actions the LLM should perform, either using tools or responding to the human."
        }
    },
    "required": ["Actions"],
    "additionalProperties": false
};

// Validate the LLM response against an expected schema
function validateLLMResponse(responseString) {
    try {
        // Parse the JSON string into an object
        const response = JSON.parse(responseString);

        // Validate the parsed object against the predefined schema
        const validationResult = validateJson(response, llmResponseSchema);
        
        if (validationResult.valid) {
            // Return true if the response is valid according to the schema
            return { isValid: true, message: "LLM response schema validation successful." };
        } else {
            // Return the single error message if the response fails validation
            return { isValid: false, message: "LLM response schema validation failed: " + validationResult.error };
        }
    } catch (error) {
        // Handle and return JSON parsing errors
        return { isValid: false, message: "Error parsing JSON: " + error.message };
    }
}

// Function to test various LLM responses
function testLLMResponses() {
    // Define test cases
    const testCases = [
        {
            description: "Valid response",
            response: JSON.stringify({
                "Thought": "I will start by greeting the human.",
                "Actions": [
                    {
                        "Action": "Response To Human",
                        "Action Input": "Hello! How can I assist you today?"
                    }
                ]
            }),
            expectedValidity: true
        },
        {
            description: "Response without Thought",
            response: JSON.stringify({
                "Actions": [
                    {
                        "Action": "Response To Human",
                        "Action Input": "Hello! How can I assist you today?"
                    }
                ]
            }),
            expectedValidity: true
        },
        {
            description: "Response missing Action Input",
            response: JSON.stringify({
                "Thought": "I will start by greeting the human.",
                "Actions": [
                    {
                        "Action": "Response To Human"
                    }
                ]
            }),
            expectedValidity: false
        }
    ];

    // Test and log the results of the responses
    testCases.forEach((testCase) => {
        const validationResult = validateLLMResponse(testCase.response);
        console.log(`${testCase.description}:`, validationResult);
    });
}

export { validateLLMResponse, testLLMResponses };
