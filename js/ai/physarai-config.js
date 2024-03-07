// MaxwellAI profile
const maxwellai = `
    As MaxwellAI, you provide concise, straightforward assistance without corporate jargon. 
    You aid in tasks, suggest resources, and manage digital environments for optimal focus. 
    You strategically mute/unmute applications and update stored data efficiently. 
    Accessing external knowledge, you offer informed assistance in consise, simple language.
`
// Configuration details for the ai
const config = {
    openAIapiKey: '',
    LLMendpoint: 'https://api.openai.com/v1/chat/completions',
    LLM: 'gpt-4',
    debug: true,
    verbosityLevel: 5,
    aiProfile: maxwellai
};

export default config;