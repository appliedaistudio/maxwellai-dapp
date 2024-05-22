import { aiConfig } from './physarai-config.js';
import { log } from '../../utils/logging.js';

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

export { generateAIResponseToConversation, generateDefaultAndSuggestedUserResponses, getKeyTakeaway };
