import '../../lib/pouchdb/pouchdb.min.js';
import config from '../dapp-config.js';

// Caveats to be observed by the AI at all times
const aiCaveats = `
    In your output JSON, do not use escapes to encode quotes`;

// Initialize local and remote PouchDB instances using the provided configuration
const localDb = new PouchDB(config.localDbName);

// MaxwellAI profile
async function maxwellAiProfile() {
    // Fetch the existing settings document from localDb
    const doc = await localDb.get('dapp_settings');

    // Fetch the personality from localDb
    const personality = doc.settings.MaxwellAI_Meyers_Briggs_Personality_Type.value;

    const profile = `
    As MaxwellAI, you provide assistance and responses consistent with someone who has the Meyers-Briggs ${personality} personality type. 
    You aid in tasks, suggest resources, and manage digital environments for optimal focus. 
    You strategically mute/unmute applications and update stored data efficiently. 
    Accessing external knowledge, you offer informed assistance in concise, simple language.`;

    return profile;

}

// Retreive the setting that stores the user's personality type
async function userPersonality() {
    // Fetch the existing settings document from localDb
    const doc = await localDb.get('dapp_settings');

    // Fetch the personality from localDb
    const personality = await doc.settings.Your_Meyers_Briggs_Personality_Type.value;
    return personality;

}

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

const aiUpdateExternalResourceFeed = `
    Refine the feed of external resources based on user interactions:
    1. Get a list of the existing external resources
    2. Introduce new external resources relevant to the insights collected from user interactions.
    3. Regularly review existing external resources for relevance and update them accordingly.
    4. Remove external resources that are no longer needed.
    5. Ensure the usefulness description accurately reflects the content of the external resource for better user engagement.
    6. Categorize external resources appropriately to facilitate easy navigation and access for users.`;

const aiUpdateNotifications = `
    Refine notifications based on user interactions:
    1. Introduce notifications for actions MaxwellAI plans to take in the future, such as closing applications for focus or opening necessary apps for upcoming tasks.
    2. Ensure notifications are limited to MaxwellAI's capabilities.
    3. Revise existing notifications or introduce new ones only if insights from user interactions necessitate action not covered by current notifications.
    4. It's acceptable to take no action if existing notifications cover user needs adequately.`;

const aiUpdateTasks = `
    Refine tasks based on user interactions:
    1. Get a list of the existing tasks
    2. Review task priorities and take the initiative to adjust them based on your analysis of changing project requirements.
    3. Ensure tasks are categorized effectively for better organization and tracking.
    4. Revise task descriptions to provide clearer instructions or include additional details as needed.
    5. Update task statuses to reflect progress accurately, marking completed tasks and adjusting those in progress.
    6. Identify and address dependencies between tasks, updating dependent tasks accordingly.
    7. It's advisable to regularly review and update task deadlines to align with project timelines and goals.
    8. Consider introducing new tasks or merging existing ones to streamline workflows and improve efficiency.
    9. Take user feedback and project insights into account when updating tasks to enhance project management processes.`;


// Configuration details for the AI
const aiConfig = {
    LLM: 'gpt-4',
    verbosityLevel: 2,
    aiProfile: maxwellAiProfile(),
    aiCaveats,
    aiUserResponses: defaultAndSuggestedUserResponses,
    aiUpdateFeed: aiUpdateExternalResourceFeed,
    aiUpdateNotifications,
    aiUpdateTasks
};

export default aiConfig;
