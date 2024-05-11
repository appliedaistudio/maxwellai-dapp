import '../../lib/pouchdb/pouchdb.min.js';

// Import configuration module
import { formatJson, validateJson } from '../utils/string-parse.js';
import aiConfig from './physarai-config.js';
import config from '../dapp-config.js';

import { log } from '../utils/logging.js';
import { removeNonAlphanumeric, removeCharacter, replaceCharacter } from '../utils/string-parse.js';
import { decryptString } from '../utils/encryption.js';


// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Define a function to fetch the LLM API key
async function llmApiKey() {

    // Retrieve the 'dapp_settings' document from the local database synchronously
    const settingsDoc = await localDb.get('dapp_settings');
    
    // Access and decrypt the LLM API key from the settings object
    const decryptedApiKey = await decryptString(settingsDoc.settings.LLM_api_key);
    return decryptedApiKey;
}

// Define a function to fetch the LLM end point
async function llmEndpoint() {

    // Retrieve the 'dapp_settings' document from the local database synchronously
    const settingsDoc = await localDb.get('dapp_settings');
    
    // Access and decrypt the LLM endpoint from the settings object
    const decryptedLlmEndpoint = await decryptString(settingsDoc.settings.LLM_endpoint);
    return decryptedLlmEndpoint;
}

// Function to interact with the Language Model (LLM)
async function promptLLM(parameters) {
    const functionName = "promptLLM";

    log("Entering promptLLM function", aiConfig.verbosityLevel, 3, functionName); // Log function entry with verbosity level 3

    try {
        // Check if all required parameters are provided
        if (!parameters.apiKey || !parameters.prompt || !parameters.endpoint || !parameters.model) {
            throw new Error('Missing required parameter(s)');
        }

        // Destructure parameters object for easier access
        const { apiKey, prompt, endpoint, model } = parameters;

        // Create a prompt that contains the ai profile and ai caveats
        const promptWithProfileAndCaveats = aiConfig.aiProfile + prompt + aiConfig.aiCaveats;

        // Send a POST request to the LLM endpoint with the given parameters
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "model": model,
                "messages": [{"role": "user", "content": promptWithProfileAndCaveats}]
            })
        });

        // Check if the response is successful
        if (!response.ok) {
            const errorData = await response.json(); // Parse error response
            throw new Error(`API Error: ${errorData.error.message}`); // Use API error message
        }

        // Parse the response JSON and return the generated text
        const data = await response.json();

        log("Exiting promptLLM function", aiConfig.verbosityLevel, 3, functionName); // Log function exit with verbosity level 3

        return data.choices[0].message.content;
    } catch (error) {
        // Log and handle errors
        log('PromptLLM error: ' + error, aiConfig.verbosityLevel, 1, functionName); // Log error with verbosity level 1
        return null;
    }
};

// Function specifically for handling degraded mode in AI conversation response scenarios
function degradedModeAIConversationResponse() {
    // Return a response tailored to the context of AI conversation failures
    return "I'm sorry, I can't provide a tailored response right now. Please try again later.";
};

// Function to generate AI response based on the conversation data.
async function generateAIResponseToConversation(conversationData) {
    const functionName = "generateAIResponseToConversation";

    try {
        // Convert conversationData into a formatted string of dialogue
        const conversationString = conversationData.dialogue.map(message => `${message.speaker}: ${message.text}`).join('\n');

        // Prepare AI prompt based on the conversation history
        const aiPrompt = `Given the following conversation:\n\n${conversationString}\n\nWhat should the AI respond?`;

        // Retrieve the AI API key from settings
        const aiApiKey = await llmApiKey();

        // Retrieve the AI endpoint from settings
        const aiEndpoint = await llmEndpoint();

        // Call AI service to generate a response based on the conversation
        const aiResponse = await promptLLM({
            apiKey: aiApiKey,
            prompt: aiPrompt,
            endpoint: aiEndpoint,
            model: aiConfig.LLM
        });

        // Check if the AI service is unavailable and trigger the specific degraded mode for AI conversation response
        if (aiResponse === null) {
            return degradedModeAIConversationResponse();
        }

        return aiResponse;
    } catch (error) {
        // Log the error if something goes wrong during the process
        log("Error generating AI response to conversation:" + error, aiConfig.verbosityLevel, 1, functionName);
    }
};

// Function to handle degraded mode for generating user responses
function degradedModeUserResponses() {
    // Return a predefined JSON structure with default and suggested responses
    return {
        defaultUserResponses: [
            "Got new project ideas?",
            "Let's chat about projects.",
            "I'm considering new goals for myself."
        ],
        suggestedUserResponses: {
            "current projects": [
                "I want to update you on my progress.", 
                "I'd like feedback on my latest work.", 
                "I want to talk about a challenge I'm facing"
            ],
            "inspiration and ideas": [
                "I'd like to share a new writing prompt.", 
                "I'd like to explore a creative spark.", 
                "I want to brainstorm on plot twists and characters."
            ],
            "support and feedback": [
                "I need some encouragement.", 
                "I need help getting past my writer's block.", 
                "I need help staying motivated."
            ]
        }
    };
};

// Function to generate default and suggested responses based on conversation data
async function generateDefaultAndSuggestedUserResponses(conversationData) {
    const functionName = "generateDefaultAndSuggestedUserResponses";

    try {
        // Convert conversation data into a formatted string of dialogue
        const conversationString = conversationData.dialogue.map(message => `${message.speaker}: ${message.text}`).join('\n');

        // Create an AI prompt asking for suggested user responses
        const aiPrompt = `
            Given the following conversation:
            ${conversationString}
            ${aiConfig.aiUserResponses}`;

        // Retrieve the AI API key from settings
        const aiApiKey = await llmApiKey();

        // Retrieve the AI endpoint from settings
        const aiEndpoint = await llmEndpoint();

        // Request the AI to generate default and suggested user responses
        const aiResponse = await promptLLM({
            apiKey: aiApiKey,
            prompt: aiPrompt,
            endpoint: aiEndpoint,
            model: aiConfig.LLM
        });

        // Check if the AI response is null and handle degraded mode
        if (aiResponse === null) {
            return degradedModeUserResponses();
        }

        // Parse and return the AI response as JSON
        const aiResponseJson = JSON.parse(aiResponse);
        console.log("Generating default responses");
        console.log(aiResponseJson);
        return aiResponseJson;
    } catch (error) {
        // Log the error encountered during AI response generation
        log("Error generating AI response to conversation:" + error, aiConfig.verbosityLevel, 1, functionName);
        // Return the degraded mode response due to error
        return degradedModeUserResponses();
    }
};

// Specific function for handling degraded mode when fetching key takeaways
function enterDegradedModeKeyTakeaway() {
    // Return a degraded mode response tailored to the context of key takeaway failures
    return "Unable to fetch key takeaways at the moment. Please try again later.";
};

// Function to extract key takeaways from a conversation using AI.
async function getKeyTakeaway(conversationData, documentId, conversationId) {
    const functionName = "getKeyTakeaway";

    try {
        // Condense conversationData into a string listing what AI and user said to each other
        const conversationString = conversationData.dialogue.map(message => `${message.speaker}: ${message.text}`).join('\n');

        // Create a short AI prompt asking for the key takeaway of the conversation
        const aiPrompt = `
            ${aiConfig.aiProfile}
            Given the following conversation:
            ${conversationString}
            ${aiConfig.aiKeytakeaway(documentId, conversationId)}`;

        // Retrieve the AI API key from settings
        const aiApiKey = await llmApiKey();

        // Retrieve the AI endpoint from settings
        const aiEndpoint = await llmEndpoint();

        // Call AI service to generate a response for the key takeaway
        const aiResponse = await promptLLM({
            apiKey: aiApiKey,
            prompt: aiPrompt,
            endpoint: aiEndpoint,
            model: aiConfig.LLM
        });

        // Check if the AI service response is null and enter degraded mode if so
        if (aiResponse === null) {
            return enterDegradedModeKeyTakeaway();
        }

        // Convert the AI response to a string and return it
        return aiResponse.toString();
    } catch (error) {
        // Log the error
        log("Error getting key takeaway:" + error, aiConfig.verbosityLevel, 1, functionName);
    }
};

// Creates the prompt that turns a normal LLM into a ReAct agent
function generateReActAgentLLMPrompt(tools) {
    const functionName = "generateReActAgentLLMPrompt";

    log("Entering function", aiConfig.verbosityLevel, 3, functionName); // Log function entry with verbosity level 3

    // Define the prompt using a template
    const prompt = `
    Answer the following questions and obey the following commands as best you can.

    You have access to the following tools:
    ${tools.map(tool => `\n{"name": "${tool.name}", "description": "${tool.description}"}`).join(',')}

    Response To Human: When you need to respond to the human you are talking to.

    You will receive a message from the human, then you should start a loop and perform one of the following actions:

    Option 1: Use a tool to answer the question.
    For this, follow the JSON format:
    {
        "Thought": "Always think about what to do.",
        "Action": "[Tool Name]", 
        "Action Input": "[Input to the tool]"
    }

    Option 2: Respond to the human.
    For this, follow the JSON format:
    {
        "Action": "Response To Human",
        "Action Input": "[Your response to the human, summarizing what you did and what you learned]"
    }

    Ensure each response is a single JSON object. Maintain clarity and conciseness in your actions and inputs.

    Begin!`;
    
    log(`Generated LLM prompt: ${prompt}`, aiConfig.verbosityLevel, 3, functionName); // Log generated LLM prompt with verbosity level 3
    log("Exiting function", aiConfig.verbosityLevel, 3, functionName); // Log function exit with verbosity level 3

    return prompt;
};

// Helper function to extract action and input from JSON response
function extractActionAndInput(jsonText) {
    const functionName = "extractActionAndInput";

    try {
        log("Entering function", aiConfig.verbosityLevel, 1, functionName); // Log function entry with verbosity level
        log("Input JSON:", aiConfig.verbosityLevel, 1, functionName); // Log input JSON with verbosity level
        log(jsonText, aiConfig.verbosityLevel, 1, functionName); // Log input JSON with verbosity level

        // Parse the JSON text into an object
        const responseObject = JSON.parse(jsonText);

        // Extract 'Action' and 'Action Input' from the JSON object
        const action = responseObject.Action ? responseObject.Action : null;
        const actionInput = responseObject["Action Input"] ? responseObject["Action Input"] : null;

        log("Action:", aiConfig.verbosityLevel, 1, functionName); // Log action with verbosity level
        log(action, aiConfig.verbosityLevel, 1, functionName); // Log action with verbosity level
        log("Input:", aiConfig.verbosityLevel, 1, functionName); // Log input with verbosity level
        log(actionInput, aiConfig.verbosityLevel, 1, functionName); // Log input with verbosity level
        log("Exiting function", aiConfig.verbosityLevel, 1, functionName); // Log function exit with verbosity level

        return [action, actionInput];
    } catch (error) {
        // Log the error
        log("Error in extractActionAndInput: " + error, aiConfig.verbosityLevel, 1, functionName);
        // Return an empty array with null values to indicate an error
        return [null, null];
    }
};

// Prepares context for AI operation based on interaction insights
function prepareContext(insightTakeaways) {
    const contextContent = JSON.stringify(insightTakeaways);
    return `
        Consider, as context, the following insights collected from user interactions:
        ${contextContent}
        `;
};

// Generates initial messages for AI interaction
function prepareMessages(System_prompt, promptWithContext) {
    return [
        { "role": "system", "content": System_prompt },
        { "role": "user", "content": promptWithContext },
    ];
};

// Interacts with the LLM using the provided configuration
async function interactWithLLM(aiApiKey, aiEndpoint, messages) {
    return await promptLLM({
        apiKey: aiApiKey,
        prompt: JSON.stringify(messages),
        endpoint: aiEndpoint,
        model: aiConfig.LLM,
    });
};

// Executes actions determined by the LLM
async function executeAction(tool, action, action_input) {
    if (tool) {
        return await tool.func(action_input);
    }
    return null;
};

// Main AI function that manages user inputs, tool interactions, and logging
async function PhysarAI(tools, insightTakeaways, prompt, outputSchema) {
    const functionName = "PhysarAI";

    // Log entry into the PhysarAI function
    log("Entering PhysarAI function", aiConfig.verbosityLevel, 1, functionName);

    // Validate necessary properties in the output schema
    if (!outputSchema.properties.hasOwnProperty("success") || !outputSchema.properties.hasOwnProperty("errorMessage")) {
        throw new Error("Output schema must contain properties for 'success' and 'errorMessage'");
    }

    // Prepare context and prompt for interaction
    const context = prepareContext(insightTakeaways);
    const promptWithContext = context + prompt;
    const System_prompt = generateReActAgentLLMPrompt(tools);
    let messages = prepareMessages(System_prompt, promptWithContext);

    const maximum_allowable_ai_reasoning_iterations = 15;

    // Process interactions up to the maximum allowed iterations
    for (let i = 0; i < maximum_allowable_ai_reasoning_iterations; i++) {
        log(`Loop run number: ${i+1}`, aiConfig.verbosityLevel, 1, functionName);

        // Retrieve API key and endpoint for the LLM
        const aiApiKey = await llmApiKey();
        const aiEndpoint = await llmEndpoint();

        // Attempt interaction with LLM
        const response = await interactWithLLM(aiApiKey, aiEndpoint, messages);

        // Check if the LLM interaction was unsuccessful
        if (!response) {
            // Handle case where LLM is unavailable. Wait for LLM to become available again
            await new Promise(resolve => setTimeout(resolve, 20000));

            // Log and exit the function in degraded mode
            log("Exiting PhysarAI process iteration due to LLM degraded mode", aiConfig.verbosityLevel, 2, functionName);
        } else {
            // Process successful LLM interaction
            const [action, action_input] = extractActionAndInput(response);
            const tool = tools.find(tool => tool.name === action);
            const observation = await executeAction(tool, action, action_input);

            // Log the observation from taking the action with verbosity level 1
            log("Observation from the action taken: " + observation, aiConfig.verbosityLevel, 1, functionName);

            if (observation) {
                messages.push({ "role": "system", "content": response });
                messages.push({ "role": "user", "content": "Observation: " + observation });
            } else if (action === "Response To Human") {
                log("Response to Human: " + action_input, aiConfig.verbosityLevel, 2, functionName);
            } else {
                break;
            }
        }

        // Delay between iterations to manage load
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Log function exit
    log("Exiting PhysarAI function", aiConfig.verbosityLevel, 1, functionName);
};

// Example usage of PhysarAI function
async function testPhysarAI() {
    const functionName = "testPhysarAI";

    // Enter main function
    log("Entering main function", aiConfig.verbosityLevel, 1, functionName); // Log function entry with verbosity level 1

    // Function to search Wikipedia
    function searchWikipedia(searchTerm) {
        return "Ronny, Bobby, Ricky, and Mike";
    };

    // Calculator function with real implementation
    function calculator(expression) {
        return 16;
    };

    // Define an array of tool objects
    const tools = [
        {
            name: "Search",
            func: searchWikipedia,
            description: "Useful for when you need to answer questions about current events. You should ask targeted questions."
        },
        {
            name: "Calculator",
            func: calculator,
            description: "Useful for when you need to answer questions about math. Use python code, eg: 2 + 2"
        }
    ];

    // Define the desired operation
    const prompt = "what is the square of the number of new openAI board members"

    // Define the desired JSON schema
    const outputSchema = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "properties": {
            "success": {
                "type": "boolean"
            },
            "outputValue": {
                "type": "integer"
            },
            "errorMessage": {
                "type": "string"
            }
        },
        "required": ["outputValue", "success"]
    };    

    // Call PhysarAI function
    const userInteractionInsights = "";
    const outcome = await PhysarAI(tools, userInteractionInsights, prompt, outputSchema);

    // Exit main function
    log("Exiting main function", aiConfig.verbosityLevel, 1, functionName); // Log function exit with verbosity level 1
};

// Test connecting to local LLM
async function testLocalLLM() {
    const functionName = "testLocalLLM";
    log("Enter function", aiConfig.verbosityLevel, 1, functionName); // Log function entry with verbosity level 1

    const aiPrompt = "What is your name?";

    // Recall the LLM API key and endpoint from the settings data
    const aiApiKey = await llmApiKey();
    const aiEndpoint = await llmEndpoint();

    // Call promptLocalLLM function to get the AI response
    const aiResponse = await promptLLM({
        apiKey: aiApiKey,
        prompt: aiPrompt,
        endpoint: aiEndpoint,
        model: aiConfig.LLM
    });
    log("Local LLM response: " + aiResponse, aiConfig.verbosityLevel, 1, functionName); // Log function exit with verbosity level 1

    log("Exit function", aiConfig.verbosityLevel, 1, functionName); // Log function exit with verbosity level 1
}

export {getKeyTakeaway, generateAIResponseToConversation, generateDefaultAndSuggestedUserResponses, PhysarAI, testPhysarAI, testLocalLLM}
