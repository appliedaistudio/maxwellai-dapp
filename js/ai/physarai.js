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
            throw new Error('Network response was not ok');
        }

        // Parse the response JSON and return the generated text
        const data = await response.json();

        log("Exiting promptLLM function", aiConfig.verbosityLevel, 3, functionName); // Log function exit with verbosity level 3

        return data.choices[0].message.content;
    } catch (error) {
        // Log and handle errors
        log('PromptLLM error: ' + error, aiConfig.verbosityLevel, 2, functionName); // Log error with verbosity level 2
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
        console.error('Error generating AI response to conversation:', error);
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
        console.error('Error generating AI response to conversation:', error);
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
        // Log the error if something goes wrong during the process
        console.error('Error getting key takeaway:', error);
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
    ${tools.map(tool => `\n${tool.name}: ${tool.description}`).join('')}
    
    Response To Human: When you need to respond to the human you are talking to.
    
    You will receive a message from the human, then you should start a loop and do one of two things:
    
    Option 1: use a tool to answer the question.
    For this, you should use the following format:
    Thought: always think about what to do
    Action: tool name, must be one of [${tools.map(tool => tool.name).join(', ')}]
    Action Input: "input to the tool"
    
    After this, the human will respond with an observation, and you will continue.
    
    Option 2: respond to the human.
    For this, you should use the following format:
    Action: Response To Human
    Action Input: "your response to the human, summarizing what you did and what you learned"
    
    Make sure your response follows this format:
    Action: [Action Name]
    Action Input: [Input Value]
    
    For each response, include only one action and its corresponding input.
    Keep the loop concise and direct.

    Begin!`;
    
    log(`Generated LLM prompt: ${prompt}`, aiConfig.verbosityLevel, 3, functionName); // Log generated LLM prompt with verbosity level 3
    log("Exiting function", aiConfig.verbosityLevel, 3, functionName); // Log function exit with verbosity level 3

    return prompt;
};

// Helper function to extract action and input from text
function extractActionAndInput(text) {
    const functionName = "extractActionAndInput";

    try {
        log("Entering function", aiConfig.verbosityLevel, 4, functionName); // Log function entry with verbosity level 4
        log("Input text:", aiConfig.verbosityLevel, 4, functionName); // Log input text with verbosity level 4
        log(text, aiConfig.verbosityLevel, 4, functionName); // Log input text with verbosity level 4

        // Find the index of "Action:" and "Action Input:" in the text
        const actionIndex = text.indexOf("Action:");
        const inputIndex = text.indexOf("Action Input:");

        let action = null;
        // If "Action:" is found in the text, extract the action substring and remove non-alphanumeric characters
        if (actionIndex !== -1) {
            const actionStart = actionIndex + "Action:".length;
            const actionEnd = inputIndex !== -1 ? inputIndex : text.length;
            action = text.substring(actionStart, actionEnd).trim();
            action = removeNonAlphanumeric(action);
        }

        let input = null;
        // If "Action Input:" is found in the text, extract the input substring and clean up the string
        // TODO: REPLACE THE REGEX AND FIX THE CASE OF \N
        if (inputIndex !== -1) {
            const inputStart = inputIndex + "Action Input:".length;
            input = text.substring(inputStart).trim().replace(/^\"|\"$/g, '');
            input = replaceCharacter(input, '\\\\\\"', '"');
            input = replaceCharacter(input, '\\"', '"');
        }

        log("Action:", aiConfig.verbosityLevel, 4, functionName); // Log action with verbosity level 4
        log(action, aiConfig.verbosityLevel, 4, functionName); // Log action with verbosity level 4
        log("Input:", aiConfig.verbosityLevel, 4, functionName); // Log input with verbosity level 4
        log(input, aiConfig.verbosityLevel, 4, functionName); // Log input with verbosity level 4
        log("Exiting function", aiConfig.verbosityLevel, 4, functionName); // Log function exit with verbosity level 4

        return [action, input];
    } catch (error) {
        // Log the error
        log("Error in extractActionAndInput: " + error, aiConfig.verbosityLevel, 1, functionName);
        // Return an empty list
        return [null, null];
    }
};

// Function to format the response to human
async function formatResponseToHuman(output, schema) {
    const functionName = "formatResponseToHuman";

    // Enter formatObservation function
    log("Entering function", aiConfig.verbosityLevel, 4, functionName); // Log function entry with verbosity level 4

    try {
        // Log output and schema at the start of the function
        log("Output: " + output, aiConfig.verbosityLevel, 3, functionName); // Log output with verbosity level 3
        log("Schema: " + JSON.stringify(schema), aiConfig.verbosityLevel, 3, functionName); // Log schema with verbosity level 3

        const prompt = `Format the user content according to the following schema:\n${JSON.stringify(schema)}. Return a JSON result that complies with the given schema.`;

        // Recall the LLM API key and endpoint from the settings data
        const aiApiKey = await llmApiKey();
        const aiEndpoint = await llmEndpoint();

        // Call promptLLM to format the final response
        const response = await promptLLM({
            apiKey: aiApiKey,
            prompt: JSON.stringify([{ "role": "user", "content": prompt }, { "role": "system", "content": output }]),
            endpoint: aiEndpoint,
            model: aiConfig.LLM,
        });

        // Log the full response from LLM
        log("Full Response from LLM: " + response, aiConfig.verbosityLevel, 5, functionName); // Log full response from LLM with verbosity level 5

        // Parse the response as JSON
        const formattedObservation = JSON.parse(response);

        // Exit formatObservation function
        log("Exiting formatResponseToHuman function", aiConfig.verbosityLevel, 4, functionName); // Log function exit with verbosity level 4
        return formattedObservation;
    } catch (error) {
        // Log and handle errors
        log('Error: ' + error, aiConfig.verbosityLevel, 2, functionName); // Log error with verbosity level 2
        return null;
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

// Handles situations where LLM is unavailable by entering degraded mode
function handleDegradedMode() {
    return {
        action: "Response to Human",
        action_input: "The AI model is currently unavailable, and we have entered a degraded mode."
    };
};

// Main AI function that manages user inputs, tool interactions, and logging
async function PhysarAI(tools, insightTakeaways, prompt, outputSchema) {
    const functionName = "PhysarAI";

    // Enter the function and log the entry
    log("Entering PhysarAI function", aiConfig.verbosityLevel, 1, functionName);

    // Validate the presence of required properties in output schema
    if (!outputSchema.properties.hasOwnProperty("success") || !outputSchema.properties.hasOwnProperty("errorMessage")) {
        throw new Error("Output schema must contain properties for 'success' and 'errorMessage'");
    }

    // Prepare context from insights
    const context = prepareContext(insightTakeaways);
    const promptWithContext = context + prompt;
    const System_prompt = generateReActAgentLLMPrompt(tools);
    let messages = prepareMessages(System_prompt, promptWithContext);

    const maximum_allowable_ai_reasoning_iterations = 2;

    // Process interactions up to the maximum iterations
    for (let i = 0; i < maximum_allowable_ai_reasoning_iterations; i++) {
        log(`Loop run number: ${i+1}`, aiConfig.verbosityLevel, 1, functionName);

        // Retrieve API key and endpoint for the LLM
        const aiApiKey = await llmApiKey();
        const aiEndpoint = await llmEndpoint();

        // Interact with LLM and receive response
        const response = await interactWithLLM(aiApiKey, aiEndpoint, messages);

        // Check for null response to determine if LLM is unavailable
        if (!response) {
            const degradedResponse = handleDegradedMode();

            // Exit the function and log the exit
            log("Exiting PhysarAI function in degraded mode", aiConfig.verbosityLevel, 1, functionName);

            return degradedResponse.action_input; // Return degraded mode message
        }

        // Extract action and input from the LLM response
        const [action, action_input] = extractActionAndInput(response);
        const tool = tools.find(tool => tool.name === action);
        const observation = await executeAction(tool, action, action_input);

        if (observation) {
            messages.push({ "role": "system", "content": response });
            messages.push({ "role": "user", "content": "Observation: " + observation });
        } else if (action === "Response To Human") {
            return action_input; // Return response directly to human
        } else {
            break; // Exit loop if action is invalid or not actionable
        }

        // Wait for 2 seconds before the next iteration to prevent overload
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Exit the function and log the exit
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
