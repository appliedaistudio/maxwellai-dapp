import '../../../lib/pouchdb/pouchdb.min.js';
import config from '../../dapp-config.js';
import { decryptString } from '../../utils/encryption.js';

// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Retrieve the setting that stores MaxwellAI's personality type
async function maxwellaiPersonality() {
    try {
        // Fetch the existing settings document from localDb
        const doc = await localDb.get('dapp_settings');
        
        // Fetch and decrypt the personality from localDb
        const encryptedPersonality = await doc.settings.MaxwellAI_Meyers_Briggs_Personality_Type.value;
        const personality = await decryptString(encryptedPersonality);
        return personality;
    } catch (error) {
        // Return null if there is an error
        return null;
    }
};

// Retrieve the setting that stores the user's personality type
async function userPersonality() {
    try {
        // Fetch the existing settings document from localDb
        const doc = await localDb.get('dapp_settings');
        
        // Fetch and decrypt the personality from localDb
        const encryptedPersonality = await doc.settings.Your_Meyers_Briggs_Personality_Type.value;
        const personality = await decryptString(encryptedPersonality);
        return personality;
    } catch (error) {
        // Return null if there is an error
        return null;
    }
};

// Caveats to be observed by the AI at all times
const aiCaveats = `
    In your output JSON, do not use escapes to encode quotes`;

// MaxwellAI profile
const maxwellaiProfile = `
    As MaxwellAI, you provide assistance and responses consistent with someone who has the Meyers-Briggs ${maxwellaiPersonality()} personality type. 
    Your capabilities are as follows:
    1. You aid in tasks, suggest resources, and manage digital environments for optimal focus. 
    2. You strategically mute/unmute applications and update stored data efficiently. 
    3. Accessing external knowledge, you offer informed assistance in concise, simple language.`;

const defaultAndSuggestedUserResponsesSchema = `
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "defaultUserResponses": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "suggestedUserResponses": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            }
        },
        "required": [
            "defaultUserResponses",
            "suggestedUserResponses"
        ]
    }`;

const defaultAndSuggestedUserResponses = `
    Generate default and categorized user responses for the conversation. 
    Respond only wiht JSON that adheres to this schema: ${defaultAndSuggestedUserResponsesSchema}. 
    Do not include the schema in the response. Limit responses to at most 3 per category.
    
    The default and categorized responses are the user's (human) most likely reaction to the existing conversation. 
    They should be consisten with someone who has the ${userPersonality()} Meyers-Briggs personality type. 
    Anticipate a range of likely responses. `;

function aiConversationResponse(conversationString){
    const aiPrompt = `
        Given the following conversation:\n\n${conversationString}\n\nWhat should the AI respond?
        Your response must be in plain text only (not JSON)`;
    return aiPrompt
}

function aiKeytakeaway(documentId, conversationId){
    const takeaway = `
    What is the key takeaway from this conversation? 
    If the takeaway involves updating data, include the document ID (${documentId}) and conversation ID (${conversationId}) in the directive for the AI to take action.`;

    return takeaway;
};

const aiUpdateNetwork = `
    Create, update, or delete network entities in a way that aligns with MaxwellAI capabilities, key takeaways from user interactions, and existing tasks.`;

const aiUpdateNotifications = `
    Create, update, or delete notifications in a way that aligns with MaxwellAI capabilities, key takeaways from user interactions, and existing tasks.
    Try to keep the total number of notifications to 5 or fewer.`;


const aiUpdateTasks = `
    Create, update, or delete tasks in a way that aligns with key takeaways from user interactions. Try to keep the total number of tasks to 5 or fewer.`;

// Configuration details for the AI
const aiConfig = {
    aiSubstrateFolder: "conference-productivity",
    LLM: 'gpt-4o',
    verbosityLevel: 1,
    aiProfile: maxwellaiProfile,
    aiCaveats,
    aiKeytakeaway,
    aiUserResponses: defaultAndSuggestedUserResponses,
    aiConversationResponse,
    aiUpdateNetwork: aiUpdateNetwork,
    aiUpdateNotifications,
    aiUpdateTasks
};

export { aiConfig };