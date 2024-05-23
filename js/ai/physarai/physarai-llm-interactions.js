
import { aiConfig } from './physarai-config.js';
import { log } from '../../utils/logging.js';

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

export { promptLLM };
