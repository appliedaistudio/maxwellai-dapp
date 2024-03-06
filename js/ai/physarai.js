// Import configuration module
import { formatJson } from '../utils/string-parse.js';
import config from './physarai-config.js';

// Log a message with function name if the current verbosity level is equal to or higher than the specified minimum verbosity level
function log(message, currentVerbosity, minVerbosity, functionName) {
    if (currentVerbosity >= minVerbosity && config.debug) { // Log only if verbosity level is equal to or higher than the specified minimum verbosity level and debug mode is enabled in config
        console.log(`[${functionName}] ${message}`);
    }
}

// Function to interact with the Language Model (LLM)
async function promptLLM(parameters) {
    const functionName = "promptLLM";

    log("Entering promptLLM function", config.verbosityLevel, 3, functionName); // Log function entry with verbosity level 3

    try {
        // Check if all required parameters are provided
        if (!parameters.apiKey || !parameters.prompt || !parameters.endpoint || !parameters.model) {
            throw new Error('Missing required parameter(s)');
        }

        // Destructure parameters object for easier access
        const { apiKey, prompt, endpoint, model } = parameters;

        // Send a POST request to the LLM endpoint with the given parameters
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            })
        });

        // Check if the response is successful
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Parse the response JSON and return the generated text
        const data = await response.json();

        log("Exiting promptLLM function", config.verbosityLevel, 3, functionName); // Log function exit with verbosity level 3

        return data.choices[0].message.content;
    } catch (error) {
        // Log and handle errors
        log('PromptLLM error: ' + error, config.verbosityLevel, 2, functionName); // Log error with verbosity level 2
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

        // Call promptLLM function to get the AI response
        const aiResponse = await promptLLM({
            apiKey: config.openAIapiKey,
            prompt: aiPrompt,
            endpoint: config.LLMendpoint,
            model: config.LLM
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
            
            Generate default and categorized user responses for the conversation. 
            Provide the output in the JSON format that follows this example:
            
            {
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
            }`;

        // Call promptLLM function to get the LLM response
        const aiResponse = await promptLLM({
            apiKey: config.openAIapiKey,
            prompt: aiPrompt,
            endpoint: config.LLMendpoint,
            model: config.LLM
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

//TODO: RENAME THIS. MAKE IT MORE SPECIFIC
function generateLLMPrompt(tools) {
    const functionName = "generateLLMPrompt";

    log("Entering generateLLMPrompt function", config.verbosityLevel, 3, functionName); // Log function entry with verbosity level 3

    // Define the prompt using a template
    const prompt = `
    Answer the following questions and obey the following commands as best you can.
    
    You have access to the following tools:
    ${tools.map(tool => `\n${tool.name}: ${tool.description}`).join('')}
    
    Response To Human: When you need to respond to the human you are talking to.
    
    You will receive a message from the human, then you should start a loop and do one of two things
    
    Option 1: You use a tool to answer the question.
    For this, you should use the following format:
    Thought: you should always think about what to do
    Action: the action to take, should be one of [${tools.map(tool => tool.name).join(', ')}]
    Action Input: "the input to the action, to be sent to the tool"
    
    After this, the human will respond with an observation, and you will continue.
    
    Option 2: You respond to the human.
    For this, you should use the following format:
    Action: Response To Human
    Action Input: "your response to the human, summarizing what you did and what you learned"
    
    Preface action with "Action:" place the alphanumeric name of the action immediately after followed by a line feed
    Preface action input with "Action Input:". place the input value in quotes immediately after followed by a line feed
    
    Begin!`;
    
    log(`Generated LLM prompt: ${prompt}`, config.verbosityLevel, 3, functionName); // Log generated LLM prompt with verbosity level 3
    log("Exiting generateLLMPrompt function", config.verbosityLevel, 3, functionName); // Log function exit with verbosity level 3

    return prompt;
};

// Helper function to remove non-alphanumeric characters from text
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

// Helper function to extract action and input from text
function extract_action_and_input(text) {
    const functionName = "extract_action_and_input";

    log("Entering extract_action_and_input function", config.verbosityLevel, 4, functionName); // Log function entry with verbosity level 4
    log("Input text:", config.verbosityLevel, 4, functionName); // Log input text with verbosity level 4
    log(text, config.verbosityLevel, 4, functionName); // Log input text with verbosity level 4

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
    // If "Action Input:" is found in the text, extract the input substring and remove non-alphanumeric characters
    if (inputIndex !== -1) {
        const inputStart = inputIndex + "Action Input:".length;
        input = text.substring(inputStart).trim().replace(/^\"|\"$/g, '');
        //input = removeNonAlphanumeric(input);
    }

    log("Action:", config.verbosityLevel, 4, functionName); // Log action with verbosity level 4
    log(action, config.verbosityLevel, 4, functionName); // Log action with verbosity level 4
    log("Input:", config.verbosityLevel, 4, functionName); // Log input with verbosity level 4
    log(input, config.verbosityLevel, 4, functionName); // Log input with verbosity level 4
    log("Exiting extract_action_and_input function", config.verbosityLevel, 4, functionName); // Log function exit with verbosity level 4
    return [action, input];
};

// Function to format the response to human
async function formatResponseToHuman(output, schema) {
    const functionName = "formatResponseToHuman";

    // Enter formatObservation function
    log("Entering function", config.verbosityLevel, 4, functionName); // Log function entry with verbosity level 4

    try {
        // Log output and schema at the start of the function
        log("Output: " + output, config.verbosityLevel, 3, functionName); // Log output with verbosity level 3
        log("Schema: " + JSON.stringify(schema), config.verbosityLevel, 3, functionName); // Log schema with verbosity level 3

        const prompt = `Format the user content according to the following schema:\n${JSON.stringify(schema)}. Return a JSON result that complies with the given schema.`;
        
        // Call promptLLM to format the final response
        const response = await promptLLM({
            apiKey: config.openAIapiKey,
            prompt: JSON.stringify([{ "role": "user", "content": prompt }, { "role": "system", "content": output }]),
            endpoint: config.LLMendpoint,
            model: config.LLM,
        });

        // Log the full response from LLM
        log("Full Response from LLM: " + response, config.verbosityLevel, 5, functionName); // Log full response from LLM with verbosity level 5

        // Parse the response as JSON
        const formattedObservation = JSON.parse(response);

        // Exit formatObservation function
        log("Exiting formatResponseToHuman function", config.verbosityLevel, 4, functionName); // Log function exit with verbosity level 4
        return formattedObservation;
    } catch (error) {
        // Log and handle errors
        log('Error: ' + error, config.verbosityLevel, 2, functionName); // Log error with verbosity level 2
        return null;
    }
};

// Stream agent function
async function PhysarAI(tools, prompt, outputSchema) {
    const functionName = "PhysarAI";

    // Enter PhysarAI function
    log("Entering PhysarAI function", config.verbosityLevel, 1, functionName); // Log function entry with verbosity level 1

    // Check if the output schema contains required fields
    if (!outputSchema.properties.hasOwnProperty("success") || !outputSchema.properties.hasOwnProperty("errorMessage")) {
        throw new Error("Output schema must contain properties for 'success' and 'errorMessage'");
    }

    // Generate the LLM prompt
    const System_prompt = generateLLMPrompt(tools);

    let messages = [
        { "role": "system", "content": System_prompt },
        { "role": "user", "content": prompt },
    ];

    for (let i = 0; i < 5; i++) {
        // Log the current loop run number
        log(`Loop run number: ${i+1}`, config.verbosityLevel, 1, functionName); // Log current loop run number with verbosity level 1

        // Get response from LLM
        const requestMessage = formatJson(messages); // Log the exact message sent to LLM
        log("Request Message sent to LLM:", config.verbosityLevel, 5, functionName); // Log message sent to LLM with verbosity level 5
        log(requestMessage, config.verbosityLevel, 5, functionName); // Log message sent to LLM with verbosity level 5

        const response = await promptLLM({
            apiKey: config.openAIapiKey,
            prompt: JSON.stringify(messages),
            endpoint: config.LLMendpoint,
            model: config.LLM,
        });

        // Log the response from LLM
        const formattedLLMpromptResponse = formatJson(response);
        log("Response from LLM: " + formattedLLMpromptResponse, config.verbosityLevel, 1, functionName); // Log response from LLM with verbosity level 1

        // Extract action and input from the response
        const [action, action_input] = extract_action_and_input(response);

        // Log the action
        log(`Action: ${action}`, config.verbosityLevel, 1, functionName); // Log action with verbosity level 1

        // Perform action based on extracted information
        const tool = tools.find(tool => tool.name === action);
        if (tool) {
            const observation = tool.func(action_input);
            // Log the observation
            log("Observation: " + observation, config.verbosityLevel, 1, functionName); // Log observation with verbosity level 1
            messages.push({ "role": "system", "content": response });
            messages.push({ "role": "user", "content": "Observation: " + observation });
        } else if (action === "Response To Human") {
            // Log the response to human
            log("Raw response to Human: " + action_input, config.verbosityLevel, 1, functionName); // Log response to human with verbosity level 1

            // Format the response to human
            const formattedResponseToHuman = await formatResponseToHuman(action_input, outputSchema);

            // Log the formatted final observation
            log("Formatted response to human: " + formatJson(formattedResponseToHuman), config.verbosityLevel, 1, functionName); // Log formatted response to human with verbosity level 1

            // Validate the final formatted response to human against the required output schema
            const validationResult = tv4.validate(formattedResponseToHuman, outputSchema);
            if (validationResult) {
                // Log the formatted final resppose to human validation success
                log("Formatted final response to human validation succeeded", config.verbosityLevel, 1, functionName); // Log validation success with verbosity level 1

                // Exit PhysarAI function
                log("Exiting PhysarAI function", config.verbosityLevel, 1, functionName); // Log function exit with verbosity level 1
                return formattedResponseToHuman;
            } else {
                // Log validation error
                log("Formatted final response to human validation error:" + tv4.error, config.verbosityLevel, 1, functionName); // Log validation error with verbosity level 1
                // Return a result conforming to the output schema with error information
                const errorResult = {
                    "success": false,
                    "outputValue": null,
                    "errorMessage": tv4.error.message || "Unknown validation error"
                };
                return errorResult;
            }

        } else {
            // Log invalid action
            log("Invalid action: " + action, config.verbosityLevel, 1, functionName); // Log invalid action with verbosity level 1
            break;
        }

        // Pause for 1 seconds between loops
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
};

// Example usage of PhysarAI function
async function testPhysarAI() {
    const functionName = "testPhysarAI";

    // Enter main function
    log("Entering main function", config.verbosityLevel, 1, functionName); // Log function entry with verbosity level 1

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
    const outcome = await PhysarAI(tools, prompt, outputSchema);

    // Exit main function
    log("Exiting main function", config.verbosityLevel, 1, functionName); // Log function exit with verbosity level 1
};

export {generateAIResponseToConversation, generateDefaultAndSuggestedUserResponses, PhysarAI, testPhysarAI}
