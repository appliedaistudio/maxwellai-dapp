import '../../../lib/pouchdb/pouchdb.min.js';

import aiConfig from './physarai-config.js';

import { llmApiKey, llmEndpoint } from './physarai-database.js';
import { interactWithLLM } from './physarai-llm-interactions.js';
import { validateLLMResponse } from './physarai-llm-schema.js';
import { extractActionsAndInputs, prepareContext, prepareMessages, executeAction, stripJsonWrapper } from './physarai-helpers.js';

import { log } from '../../utils/logging.js';
import { getLocalDateTime } from '../../utils/common.js';


// Creates the prompt that turns a normal LLM into a ReAct agent
function generateReActAgentLLMPrompt(tools) {
    const functionName = "generateReActAgentLLMPrompt";

    log("Entering function", aiConfig.verbosityLevel, 3, functionName); // Log function entry with verbosity level 3

    // Define the prompt using a template
    const prompt = `
    Answer the following questions and obey the following commands as best you can.

    You have access to the following tools:
    ${tools.map(tool => `\n{"tool name": "${tool.name}", " tool description": "${tool.description}"}`).join(',')}

    Response To Human: When you need to respond to the human you are talking to.

    You will receive a message from the human, then you should start a loop and perform one of the following actions:

    Option 1: Use a tools to answer the question.
    For this, follow the JSON format:
    {
        "Thought": "Always think about what to do.",
        "Actions": [
            {"Action": "[Tool Name]", "Action Input": "[Input to the tool]"},
            {"Action": "[Another Tool Name]", "Action Input": "[Another Input to the tool]"},
        ]
    }

    After this, the human will respond with an observation, and you will continue.

    Option 2: Respond to the human.
    For this, follow the JSON format:
    {
        "Actions": [
            {"Action": "Response To Human", "Action Input": "[Your final response to the human, summarizing the final outcome of your actions and what you learned]"}
        ]
    }

    Respond with Option 2 only after completing all actions.
    Ensure each response is a single JSON object. Maintain clarity and conciseness in your actions and inputs.
    If necessary, use one or more tools simultaneously to gather information or perform tasks.
    The local date and time is ${getLocalDateTime()}.

    Begin!`;
    
    log(`Generated LLM prompt: ${prompt}`, aiConfig.verbosityLevel, 3, functionName); // Log generated LLM prompt with verbosity level 3
    log("Exiting function", aiConfig.verbosityLevel, 3, functionName); // Log function exit with verbosity level 3

    return prompt;
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
        log(`Diffusion Wave: ${i+1}`, aiConfig.verbosityLevel, 1, functionName);

        // Retrieve API key and endpoint for the LLM
        const aiApiKey = await llmApiKey();
        const aiEndpoint = await llmEndpoint();

        // Attempt interaction with LLM
        const response = await interactWithLLM(aiApiKey, aiEndpoint, messages);

        // Validate the LLM response
        const cleanedResponse = stripJsonWrapper(response);
        const validation = validateLLMResponse(cleanedResponse);

        // Check if the LLM interaction was unsuccessful
        if (!cleanedResponse) {
            // Log and handle the case where LLM is unavailable
            log("LLM response not available, waiting for 20 seconds before retry", aiConfig.verbosityLevel, 1, functionName);

            // Wait for 20 seconds for the LLM to become available again
            await new Promise(resolve => setTimeout(resolve, 20000));
            continue;
        } else if (!validation.isValid) {
            // Log the invalid LLM response and add it to messages
            log("Invalid LLM response detected: " + validation.message, aiConfig.verbosityLevel, 1, functionName);
            messages.push({ "role": "user", "content": "Observation: " + validation.message });
            continue; // Skip processing and continue to the next iteration
        }

        // Log the LLM response
        log("LLM response " + String(cleanedResponse), aiConfig.verbosityLevel, 1, functionName);

        // Process successful LLM interaction
        const actionsAndInputs = extractActionsAndInputs(cleanedResponse);
        let combinedObservations = [];

        // Loop over each action and input from the LLM response
        for (const {action, actionInput} of actionsAndInputs) {
            // Find corresponding tool for the action
            const tool = tools.find(tool => tool.name === action);

            // Execute the action using the found tool and log the observation
            const observation = await executeAction(tool, actionInput);

            // Check if there is an observation from the action
            if (observation) {
                combinedObservations.push(observation);
                messages.push({ "role": "system", "content": cleanedResponse });
                messages.push({ "role": "user", "content": "Observation: " + observation });
            } else if (action === "Response To Human") {
                // Log response specifically for a human-directed response
                log("Exiting Physari", aiConfig.verbosityLevel, 1, functionName);
                // Exit PhysarAI
                return null;
            } else {
                // Exit PhysarAI if no observation and no specific human-directed response
                log("Exiting PhysarAI with no Response to Human", aiConfig.verbosityLevel, 1, functionName);
                return null;
            }
        }

        // Combine and log all observations from the actions taken
        if (combinedObservations.length > 0) {
            const finalObservation = combinedObservations.join(", ");
            log("Combined observations from the actions taken: " + String(finalObservation), aiConfig.verbosityLevel, 1, functionName);
        }

        // Delay between iterations to manage the load on the LLM API
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Log function exit
    log("Exiting PhysarAI function", aiConfig.verbosityLevel, 1, functionName);
};

export {PhysarAI}
