
import { aiConfig } from './physarai-config.js';
import { log } from '../../utils/logging.js';

// Helper function to extract actions and their inputs from a JSON response
function extractActionsAndInputs(jsonText) {
    const functionName = "extractActionsAndInputs";

    try {
        // Log entering the function with configured verbosity
        log("Entering function", aiConfig.verbosityLevel, 2, functionName);
        // Log the received JSON text for debugging purposes
        log("Input JSON:", aiConfig.verbosityLevel, 2, functionName);
        log(jsonText, aiConfig.verbosityLevel, 2, functionName);

        // Parse the JSON text to an object
        const responseObject = JSON.parse(jsonText);
        const actionsAndInputs = [];

        // Check if 'Actions' is an array and process each action object
        if (Array.isArray(responseObject.Actions)) {
            responseObject.Actions.forEach(actionObject => {
                // Extract the 'Action' as a string, default to "null" if undefined
                const action = actionObject.Action ? actionObject.Action.toString() : "null";
                // Serialize the 'Action Input' as a string, default to "null" if undefined
                const actionInput = actionObject["Action Input"] ? JSON.stringify(actionObject["Action Input"]) : "null";
                // Add the action and its input to the results array
                actionsAndInputs.push({action: action, actionInput: actionInput});
            });
        }

        // Create a log string of all actions and inputs and log it
        const logString = actionsAndInputs.map(pair => `Action: ${pair.action}, Input: ${pair.actionInput}`).join('; ');
        log("Actions and Inputs:", aiConfig.verbosityLevel, 2, functionName);
        log(logString, aiConfig.verbosityLevel, 2, functionName);
        // Log exiting the function
        log("Exiting function", aiConfig.verbosityLevel, 2, functionName);

        // Return the array of actions and their inputs
        return actionsAndInputs;
    } catch (error) {
        // Log any errors that occur during the function execution
        log("Error in extractActionsAndInputs: " + error.toString(), aiConfig.verbosityLevel, 1, functionName);
        return [];
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

// Executes actions determined by the LLM
async function executeAction(tool, toolInputString) {
    if (tool) {
        return await tool.func(toolInputString);
    }
    return null;
};

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

export { extractActionsAndInputs, prepareContext, prepareMessages, executeAction, stripJsonWrapper };
