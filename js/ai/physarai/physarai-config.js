import '../../../lib/pouchdb/pouchdb.min.js';
import config from '../../dapp-config.js';
import { decryptString } from '../../utils/encryption.js';

// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Retreive the setting that stores MaxwellAI's personality type
async function maxwellaiPersonality() {
    // Fetch the existing settings document from localDb
    const doc = await localDb.get('dapp_settings');

    // Fetch and decrypt the personality from localDb
    const encryptedPersonality = await doc.settings.MaxwellAI_Meyers_Briggs_Personality_Type.value;
    const personality = await decryptString(encryptedPersonality);
    return personality;

}

// Retreive the setting that stores the user's personality type
async function userPersonality() {
    // Fetch the existing settings document from localDb
    const doc = await localDb.get('dapp_settings');

    // Fetch and decrypt the personality from localDb
    const encryptedPersonality = await doc.settings.Your_Meyers_Briggs_Personality_Type.value;
    const personality = await decryptString(encryptedPersonality);
    return personality;
}

// Caveats to be observed by the AI at all times
const aiCaveats = `
    In your output JSON, do not use escapes to encode quotes`;

// MaxwellAI profile
const maxwellaiProfile = `
    As MaxwellAI, you provide assistance and responses consistent with someone who has the Meyers-Briggs ${maxwellaiPersonality()} personality type. 
    You aid in tasks, suggest resources, and manage digital environments for optimal focus. 
    You strategically mute/unmute applications and update stored data efficiently. 
    Accessing external knowledge, you offer informed assistance in concise, simple language.`;

const defaultAndSuggestedUserResponses = `
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
    }
    
    The default and categorized responses are the user's (human) most likely reaction to the existing conversation. 
    They should be consisten with someone who has the ${userPersonality()} Meyers-Briggs personality type. 
    Anticipate a range of likely responses. `;

function aiKeytakeaway(documentId, conversationId){
    const takeaway = `
    What is the key takeaway from this conversation? 
    If the takeaway involves updating data, include the document ID (${documentId}) and conversation ID (${conversationId}) in the directive for the AI to take action.`;

    return takeaway;
};

const aiUpdateNetwork = `
    Optimize the feed of external resources within the MaxwellAI Network by leveraging user interactions while keeping the network minimal yet functional:
    1. Inventory Existing Resources: List all resources under the categories of Websites, Contacts, and Devices, assessing their utility and relevance.
    2. Introduce Relevant Resources: Based on user interactions, identify and integrate new resources that fill essential gaps, ensuring no redundancy.
    3. Evaluate Resource Relevance: Periodically review the relevance of each resource, updating descriptions and statuses to maintain a streamlined and effective network.
    4. Prune Outdated Resources: Actively remove resources that are redundant or no longer provide value, aiming to keep the network lean and focused.
    5. Maintain Accurate Descriptions: Ensure that all resource descriptions accurately reflect their content, increasing user trust and engagement.
    6. Efficient Categorization: Organize resources effectively within the existing categories to ensure ease of access and navigation, enhancing user experience while maintaining a minimal network structure.`;

const aiUpdateNotifications = `
    Create, update, or delete notifications in a way that aligns with MaxwellAI capabilities, key takeaways from user interactions, and existing tasks.
    Try to keep the total number of notifications to 5 or fewer.`;


const aiUpdateTasks = `
    Create, update, or delete tasks in a way that aligns with key takeaways from user interactions. Try to keep the total number of tasks to 5 or fewer.`;

// Configuration details for the AI
const aiConfig = {
    LLM: 'gpt-4o',
    verbosityLevel: 1,
    aiProfile: maxwellaiProfile,
    aiCaveats,
    aiKeytakeaway,
    aiUserResponses: defaultAndSuggestedUserResponses,
    aiUpdateNetwork: aiUpdateNetwork,
    aiUpdateNotifications,
    aiUpdateTasks
};

export default aiConfig;