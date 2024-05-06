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

// Generate AI response to conversation based on the extracted conversation data.
async function generateAIResponseToConversation(conversationData) {
    try {
        // Condense conversationData into a string listing what AI and user said to each other
        const conversationString = conversationData.dialogue.map(message => `${message.speaker}: ${message.text}`).join('\n');

        // Create a short AI prompt asking for the AI's response to the conversation
        const aiPrompt = `Given the following conversation:\n\n${conversationString}\n\nWhat should the AI respond?`;

        // Recall the LLM API key and endpoint from the settings data
        const aiApiKey = await llmApiKey();
        const aiEndpoint = await llmEndpoint();

        // Call promptLLM function to get the AI response
        const aiResponse = await promptLLM({
            apiKey: aiApiKey,
            prompt: aiPrompt,
            endpoint: aiEndpoint,
            model: aiConfig.LLM
        });

        return aiResponse;
    } catch (error) {
        console.error('Error generating AI response to conversation:', error);
        return null;
    }
}

async function generateDefaultAndSuggestedUserResponses(conversationData) {
    try {
        // Condense conversationData into a string listing what AI and user said to each other
        const conversationString = conversationData.dialogue.map(message => `${message.speaker}: ${message.text}`).join('\n');

        // Create a short AI prompt asking for suggested default and categorized user responses
        const aiPrompt = `
            Given the following conversation:
            ${conversationString}
            ${aiConfig.aiUserResponses}`;

        // Recall the LLM API key and endpoint from the settings data
        const aiApiKey = await llmApiKey();
        const aiEndpoint = await llmEndpoint();

        // Call promptLLM function to get the LLM response
        const aiResponse = await promptLLM({
            apiKey: aiApiKey,
            prompt: aiPrompt,
            endpoint: aiEndpoint,
            model: aiConfig.LLM
        });

        // Convert the ai response to JSON
        const aiResponseJson = JSON.parse(aiResponse);
        console.log("generating default responses");
        console.log(aiResponseJson);
        return aiResponseJson;

    } catch (error) {
        console.error('Error generating AI response to conversation:', error);
        return null;
    }
}

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

        // Recall the LLM API key and endpoint from the settings data
        const aiApiKey = await llmApiKey();
        const aiEndpoint = await llmEndpoint();

        // Call promptLLM function to get the AI response
        const aiResponse = await promptLLM({
            apiKey: aiApiKey,
            prompt: aiPrompt,
            endpoint: aiEndpoint,
            model: aiConfig.LLM
        });

        return aiResponse.toString(); // Convert the AI response to a string
    } catch (error) {
        console.error('Error getting key takeaway:', error);
        return null;
    }
}

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

// AI function that processes user inputs through interaction with tools, handles errors, and logs information.
async function PhysarAI(tools, insightTakeaways, prompt, outputSchema) {
    const functionName = "PhysarAI";

    try {
        // Enter PhysarAI function
        log("Entering PhysarAI function", aiConfig.verbosityLevel, 1, functionName); // Log function entry with verbosity level 1

        // Check if the output schema contains required fields
        if (!outputSchema.properties.hasOwnProperty("success") || !outputSchema.properties.hasOwnProperty("errorMessage")) {
            throw new Error("Output schema must contain properties for 'success' and 'errorMessage'");
        }

        // convert the user interaction insights into a prompt context
        const contextContent = JSON.stringify(insightTakeaways);

        // Add insights collected from user interactions as context for the prompt
        const context = `
            Consider, as context, the following insights collected from user interactions:
            ${contextContent}
            `;
        const promptWithContext = context + prompt;

        // Generate the ReAct Agent LLM prompt
        const System_prompt = generateReActAgentLLMPrompt(tools);

        let messages = [
            { "role": "system", "content": System_prompt },
            { "role": "user", "content": promptWithContext },
        ];

        // This is a safety measure to ensure that the ai does not get caught in an endless reasoning loop
        const maximum_allowable_ai_reasoning_iterations = 25;

        for (let i = 0; i < maximum_allowable_ai_reasoning_iterations; i++) {
            // Log the current loop run number
            log(`Loop run number: ${i+1}`, aiConfig.verbosityLevel, 1, functionName); // Log current loop run number with verbosity level 1

            // Get response from LLM
            const requestMessage = formatJson(messages); // Log the exact message sent to LLM
            log("Request Message sent to LLM:", aiConfig.verbosityLevel, 5, functionName); // Log message sent to LLM with verbosity level 5
            log(requestMessage, aiConfig.verbosityLevel, 5, functionName); // Log message sent to LLM with verbosity level 5

            // Recall the LLM API key and endpoint from the settings data
            const aiApiKey = await llmApiKey();
            const aiEndpoint = await llmEndpoint();

            const response = await promptLLM({
                apiKey: aiApiKey,
                prompt: JSON.stringify(messages),
                endpoint: aiEndpoint,
                model: aiConfig.LLM,
            });

           // Extract action and input from the response
            const [action, action_input] = extractActionAndInput(response);

            // Log the action and action input
            log(`Action: ${action}`, aiConfig.verbosityLevel, 1, functionName); // Log action with verbosity level 1
            log(`Action Input: ${action_input}`, aiConfig.verbosityLevel, 1, functionName); // Log action input with verbosity level 1

            // Perform action based on extracted information
            const tool = tools.find(tool => tool.name === action);
            if (tool) {
                const observation = await tool.func(action_input);
                // Log the observation
                log("Observation: " + observation, aiConfig.verbosityLevel, 1, functionName); // Log observation with verbosity level 1
                messages.push({ "role": "system", "content": response });
                messages.push({ "role": "user", "content": "Observation: " + observation });
            } else if (action === "Response To Human") {
                // Log and return the response to human
                log("Response to Human: " + action_input, aiConfig.verbosityLevel, 2, functionName); // Log response to human with verbosity level 1
                return action_input;
            } else if (!action && !action_input) {
                // Handle case where both action and input are null
                const observation = `
                Make sure your response follows this format:
                Action: [Action Name]
                Action Input: [Input Value]
                For each response, include only one action and its corresponding input.`;

                log("Observation: " + observation, aiConfig.verbosityLevel, 1, functionName); // Log observation with verbosity level 1
                messages.push({ "role": "system", "content": response });
                messages.push({ "role": "user", "content": "Observation: " + observation });
            } else {
                // Log invalid action
                log("Invalid action: " + action, aiConfig.verbosityLevel, 1, functionName); // Log invalid action with verbosity level 1
                break;
            }

            // Pause for 2 seconds between loops
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    } catch (error) {
        // Log the error message
        log("Error in PhysarAI function: " + error.message, aiConfig.verbosityLevel, 1, functionName); // Log error message with verbosity level 0
        // Log the stack trace
        log("Stack Trace: " + error.stack, aiConfig.verbosityLevel, 1, functionName); // Log stack trace with verbosity level 0
    }
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
