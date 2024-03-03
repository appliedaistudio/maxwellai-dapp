import config from '../dapp-config.js';

import { PhysarAI } from '../ai/physarai.js';
import { searchWikipedia } from '../ai/knowledge.js';

import { formatJson } from '../utils/string-parse.js';


// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Load a stored conversation into the chat window
export async function loadChatConversation(data_name, conversationId) {
    
    // Fetch the data from PouchDB
    const data = await localDb.get(data_name);

    // Update hidden input fields with document ID and conversation ID
    document.getElementById('documentId').value = data_name;
    document.getElementById('conversationId').value = conversationId;

    const chatWindow = document.getElementById('chat-body');
    chatWindow.innerHTML = '';  // Clear existing messages

    try {
        // Find the conversation corresponding to the given ID
        const conversation = data.feedback.find(item => item._id === conversationId);
        
        if (!conversation) {
            console.error('Conversation not found.');
            return;
        }

        // Set the tooltip for the chat header to be the concatenation of all takeaway contents
        const chatHeader = document.getElementById('chat-header');
        chatHeader.title = `Takeaway: ${Object.values(conversation.takeaway).join('\n')}`;

        // Iterate over dialogue and format the messages
        conversation.dialogue.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = `${message.speaker}: ${message.text}`;
            
            // Apply different classes based on the speaker for styling
            messageDiv.className = message.speaker === 'AI' ? 'ai-message' : 'user-message';

            // Add tooltip for each message
            messageDiv.title = message.text;

            chatWindow.appendChild(messageDiv);
            chatWindow.appendChild(document.createElement('br')); // Add line break after each message
        });
        
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

// Function to save the current chat conversation to the local database
async function saveChatConversation() {
    try {
        // Retrieve the document ID and conversation ID from hidden input fields
        const documentId = document.getElementById('documentId').value;
        const conversationId = document.getElementById('conversationId').value;
        
        // Fetch the data from PouchDB
        const data = await localDb.get(documentId);
        
        // Find the conversation corresponding to the given conversationId
        const conversation = data.feedback.find(conversation => conversation._id === parseInt(conversationId));
        
        if (!conversation) {
            console.error('Conversation not found.');
            return;
        }
        
        // Update dialogue messages from the chat window
        const chatWindow = document.getElementById('chat-body');
        const dialogue = [];
        const messageDivs = chatWindow.querySelectorAll('.user-message, .ai-message');
        messageDivs.forEach(messageDiv => {
            const speaker = messageDiv.classList.contains('ai-message') ? 'AI' : 'User';
            const text = messageDiv.textContent.replace(`${speaker}: `, ''); // Remove speaker label
            dialogue.push({ speaker, text });
        });
        
        // Update conversation with the new dialogue
        conversation.dialogue = dialogue;
        
        // Extract takeaway from the chat header tooltip
        const chatHeader = document.getElementById('chat-header');
        conversation.takeaway = { project: chatHeader.title.replace('Takeaway: ', '') };
        
        // Save the updated data back to PouchDB
        await localDb.put(data);
        
        console.log('Conversation saved successfully.');
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

// Function to select a suggestion and submit it
window.selectSuggestion = function(suggestion) {
    const messageInput = document.querySelector('.chat-message-input'); // Selecting the chat input field
    const sendButton = document.querySelector('.chat-send-btn'); // Selecting the send message button
    
    // Set the suggestion text into the chat input field
    messageInput.value = suggestion;

    // Trigger a click event on the send message button
    sendButton.click();
}

// Function to load suggestions based on selected category
window.loadSuggestions = function(category) {
    // Retrieve suggestion data from script tag
    var suggestionDataScript = document.getElementById('suggestionData');
    var suggestions = JSON.parse(suggestionDataScript.textContent.trim());

    var newSuggestions = suggestions[category];

    // Clear existing suggestions
    var suggestionsContainer = document.querySelector('.chat-suggested-messages');
    suggestionsContainer.innerHTML = '';

    // Add new suggestions
    newSuggestions.forEach(function(suggestion) {
        var button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-secondary', 'btn-sm', 'm-1');
        button.textContent = suggestion;
        button.setAttribute('title', "Send '" + suggestion + "'");
        suggestionsContainer.appendChild(button);

        // Attach click event listener to each button
        button.addEventListener('click', function() {
            selectSuggestion(suggestion); // Call selectSuggestion with the suggestion
        });
    });
}

function loadSuggestedChatResponses(chatResponses) {
    // Clear existing suggested responses and response dropdown
    const suggestedResponseContainer = document.querySelector('.chat-suggested-messages');
    suggestedResponseContainer.innerHTML = '';

    const responseDropdown = document.querySelector('.response-dropdown');
    responseDropdown.innerHTML = '';

    // Load default responses into chat-suggested-messages area
    const defaultResponses = chatResponses.defaultResponses;
    defaultResponses.forEach(response => {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-secondary', 'btn-sm', 'm-1');
        button.textContent = response;
        button.title = `Send '${response}'`;
        button.addEventListener('click', function() {
            selectSuggestion(response); // Call selectSuggestion with the response
        });
        suggestedResponseContainer.appendChild(button);
    });

    // Load suggested responses into responseDropdown area
    const suggestedResponses = chatResponses.suggestedResponses;
    for (const category in suggestedResponses) {
        const categoryResponses = suggestedResponses[category];

        // Create the list item for the category
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.classList.add('dropdown-item');
        link.href = "#";
        link.textContent = category;
        link.addEventListener('click', function() {
            loadSuggestions(category); // Call loadSuggestions with the category
        });
        listItem.appendChild(link);

        const submenu = document.createElement('ul');
        submenu.classList.add('dropdown-menu');
        submenu.setAttribute('aria-labelledby', 'responseDropdown');

        categoryResponses.forEach(response => {
            const subListItem = document.createElement('li');
            const subLink = document.createElement('a');
            subLink.classList.add('dropdown-item');
            subLink.href = "#";
            subLink.textContent = response;
            subLink.addEventListener('click', function() {
                selectSuggestion(response); // Call selectSuggestion with the response
            });
            subListItem.appendChild(subLink);
            submenu.appendChild(subListItem);
        });

        listItem.appendChild(submenu);
        responseDropdown.appendChild(listItem);
    }

    // Transform the input chat responses into the suggestedData area
    const suggestedDataScript = document.getElementById('suggestionData');
    const jsonData = JSON.stringify(chatResponses.suggestedResponses);
    suggestedDataScript.textContent = jsonData;
}

function generatePrompt(conversation, aiAndUserResponses) {
    // Convert the conversation JSON to a string
    const conversationString = formatJson(conversation, null, 4);

    // Convert the ai and user response JSON to a string
    const aiAndUserResponsesString = formatJson(aiAndUserResponses, null, 4);

    // Generate the prompt string
    const prompt = `
        Given the following conversation between a user and an AI:

        ${conversationString}

        Generate an AI response and provide categorized user response suggestions. 
        The user-response categories and corresponding suggestions should cover various aspects of possible and 
        reasonable user-responses to the conversation. 
        Combine the AI response and categorized user response suggestions into an output that follows this example:

        ${aiAndUserResponsesString}
        `;

    return prompt;
}

// Function to generate AI responses
async function generateAIResponse(conversation) {
    try {
        // Define an array of tools for the AI to use in generating a response
        const tools = [
            {
                name: "Search",
                func: searchWikipedia,
                description: "Useful for when you need to answer questions about current events. You should ask targeted questions."
            }
        ];

        // Create the prompt for the AI
        const exampleSuggestedChatResponses = {
            defaultResponses: [
                "FOO Got new project ideas?",
                "Let's chat about projects.",
                "I'm considering new goals for myself."
            ],
            suggestedResponses: {
                "current projects": [
                    "FOO I want to update you on my progress.", 
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
            },
            lastAIResponse: "This is the response from the AI"
        };
        const aiPrompt = generatePrompt(conversation, exampleSuggestedChatResponses);
        console.log(`AI Prompt: ${aiPrompt}`);

        // Define the JSON schema expected of the AI response
        const chatResponsesSchema = {
            type: "object",
            properties: {
                success: { type: "boolean" }, // Added success property
                errorMessage: { type: "string" }, // Added errorMessage property
                data: { // Added data property to encapsulate the previous structure
                    type: "object",
                    properties: {
                        defaultResponses: {
                            type: "array",
                            items: { type: "string" }
                        },
                        suggestedResponses: {
                            type: "object",
                            patternProperties: {
                                ".*": {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            }
                        },
                        lastAIResponse: { type: "string" } // Add lastAIResponse property to the schema
                    },
                    required: ["defaultResponses", "suggestedResponses", "lastAIResponse"]
                }
            },
            required: ["success", "data"] // Modified required properties to include success and data
        };        

        // Call PhysarAI function
        console.log("calling physarai");
        const suggestedChatResponses = await PhysarAI(tools, aiPrompt, chatResponsesSchema);

        return suggestedChatResponses;
    } catch (error) {
        console.error('Error generating AI response:', error);
        throw error; // Rethrow the error for the caller to handle
    }
}

// Function to send a message
window.sendMessage = function() {
    const messageInput = document.querySelector('.chat-message-input'); // Selecting the chat input field
    const messageText = messageInput.value.trim(); // Get the trimmed value of the input

    if (messageText !== '') { // Check if the message is not empty
        const chatBody = document.getElementById('chat-body'); // Selecting the chat body container

        // Create a new user message element
        const userMessageElement = document.createElement('div');
        userMessageElement.classList.add('user-message');
        userMessageElement.textContent = "User: " + messageText;

        // Append the new user message element to the chat body
        chatBody.appendChild(userMessageElement);

        // Scroll to the bottom of the chat body
        chatBody.scrollTop = chatBody.scrollHeight;

        // Show typing indicator for AI
        const typingIndicator = showTypingIndicator(chatBody);

        // Clear the message input field
        messageInput.value = '';

        // Simulate AI response after a delay
        setTimeout(() => {
            // Remove the typing indicator
            chatBody.removeChild(typingIndicator);

            // Extract the current conversation from the chat window
            const extractedConversation = extractChatConversation();
            console.log('Extracted conversation:', extractedConversation);

            // Generate an AI response
            const suggestedChatResponses = generateAIResponse(extractedConversation);
            const aiResponse = suggestedChatResponses['lastAIResponse'];


            // Create a new AI message element with the selected response
            const aiMessageElement = document.createElement('div');
            aiMessageElement.classList.add('ai-message');
            aiMessageElement.textContent = "AI: " + aiResponse;

            // Append the new AI message element to the chat body
            chatBody.appendChild(aiMessageElement);

            // Scroll to the bottom of the chat body
            chatBody.scrollTop = chatBody.scrollHeight;

            //Load new suggested chat responses based on the updated conversation
            loadSuggestedChatResponses(suggestedChatResponses);

        }, 1000); // Simulate AI typing for 1 second
    }
}


function showTypingIndicator(chatBody) {
    const aiTypingElement = document.createElement('div');
    aiTypingElement.classList.add('ai-message');
    aiTypingElement.textContent = "AI is typing...";

    // Append the typing indicator to the chat body
    chatBody.appendChild(aiTypingElement);

    // Scroll to the bottom of the chat body
    chatBody.scrollTop = chatBody.scrollHeight;

    return aiTypingElement; // Return the typing indicator element
}

function extractChatConversation() {
    try {
        // Retrieve the document ID and conversation ID from hidden input fields
        const documentId = document.getElementById('documentId').value;
        const conversationId = document.getElementById('conversationId').value;
        
        if (!documentId || !conversationId) {
            console.error('Document ID or Conversation ID is missing.');
            return null;
        }

        // Find the chat body
        const chatBody = document.getElementById('chat-body');
        if (!chatBody) {
            console.error('Chat body not found.');
            return null;
        }

        // Extract dialogue messages from the chat body
        const dialogue = [];
        const messageDivs = chatBody.querySelectorAll('.user-message, .ai-message');
        messageDivs.forEach(messageDiv => {
            const speaker = messageDiv.classList.contains('ai-message') ? 'AI' : 'User';
            const text = messageDiv.textContent.replace(`${speaker}: `, ''); // Remove speaker label
            dialogue.push({ speaker, text });
        });
        
        // Extract takeaway from the chat header tooltip
        const chatHeader = document.getElementById('chat-header');
        const takeaway = chatHeader ? chatHeader.title.replace('Takeaway: ', '') : null;
        
        // Construct the conversation object
        const conversationData = {
            documentId,
            conversationId,
            dialogue,
            takeaway
        };
        
        // Return the conversation data as a JSON string
        return conversationData;
    } catch (error) {
        console.error('Error extracting conversation:', error);
        return null;
    }
}

// Function to start voice-to-text
window.startVoiceToText = function() {
    console.log("Voice-to-text entry started");
}

// Function to handle when the chat dialog is opened
async function handleChatDialogOpen() {
    try {
        // Get the current chat conversation
        const extractedConversation = extractChatConversation();
        console.log('Extracted conversation:', extractedConversation);

        // Generate AI response and load suggested chat responses based on the updated conversation
        const suggestedChatResponses = await generateAIResponse(extractedConversation);
        loadSuggestedChatResponses(suggestedChatResponses);
    } catch (error) {
        console.error('Error handling chat dialog open:', error);
    }
}

// Add event listener to the chat modal for 'shown.bs.modal' event
const chatModal = document.getElementById('chatModal');
chatModal.addEventListener('shown.bs.modal', handleChatDialogOpen);


// Event listener for the "Send Message" button click
document.querySelector('.chat-send-btn').addEventListener('click', sendMessage);

// Event listener for the Enter key press in the chat input field
document.querySelector('.chat-message-input').addEventListener('keypress', function(event) {
    // Check if the Enter key is pressed
    if (event.key === 'Enter') {
        sendMessage(); // Call the sendMessage function
    }
});

// Add event listener to the modal dialog box for 'hidden.bs.modal' event
chatModal.addEventListener('hidden.bs.modal', saveChatConversation);
