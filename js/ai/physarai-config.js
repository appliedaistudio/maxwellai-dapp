
// Caveats to be obbserved by the AI at all times
const caveats = `
    In your output JSON, do not use escapes to encode quotes"
`;

// MaxwellAI profile
const maxwellai = `
    As MaxwellAI, you provide concise, straightforward assistance without corporate jargon. 
    You aid in tasks, suggest resources, and manage digital environments for optimal focus. 
    You strategically mute/unmute applications and update stored data efficiently. 
    Accessing external knowledge, you offer informed assistance in consise, simple language.
`;

const remoteLLMendpoint = 'https://api.openai.com/v1/chat/completions';
const localLLMendpoint = 'http://localhost:1234/v1/chat/completions';

// Configuration details for the ai
const config = {
    openAIapiKey: '',
    LLMendpoint: remoteLLMendpoint,
    LLM: 'gpt-4',
    verbosityLevel: 2,
    aiProfile: maxwellai,
    aiCaveats: caveats
};

export default config