import config from '../dapp-config.js';

import { getKeyTakeaway, generateAIResponseToConversation, generateDefaultAndSuggestedUserResponses } from '../ai/physarai/physarai-ai-conversations.js';

import { log } from '../utils/logging.js';


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
        const conversation = data.feedback.find(conversation => conversation._id === conversationId);
        
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

// Load the given suggested chat responses into the AI chat window
function loadSuggestedUserChatResponses(chatResponses) {
    // Clear existing suggested responses and response dropdown
    const suggestedResponseContainer = document.querySelector('.chat-suggested-messages');
    suggestedResponseContainer.innerHTML = '';

    const responseDropdown = document.querySelector('.response-dropdown');
    responseDropdown.innerHTML = '';

    // Load default responses into chat-suggested-messages area
    const defaultResponses = chatResponses.defaultUserResponses;
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
    const suggestedResponses = chatResponses.suggestedUserResponses;
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
    const jsonData = JSON.stringify(chatResponses.suggestedUserResponses);
    suggestedDataScript.textContent = jsonData;
}

function showUserResponseSuggestionLoadingIndicator() {
    // Clear existing suggested responses and response dropdown
    const suggestedResponseContainer = document.querySelector('.chat-suggested-messages');
    suggestedResponseContainer.innerHTML = '';

    const responseDropdown = document.querySelector('.response-dropdown');
    responseDropdown.innerHTML = '';

    // Show loading message or icon
    const loadingMessage = document.createElement('p');
    loadingMessage.textContent = 'MaxwellAI is creating response suggestions...';
    loadingMessage.classList.add('loading-message'); // Add a class to the loading message
    suggestedResponseContainer.appendChild(loadingMessage);

    // You can also use an icon instead of text if preferred
     const loadingIcon = document.createElement('i');
     loadingIcon.classList.add('fa', 'fa-spinner', 'fa-spin', 'loading-icon');
     suggestedResponseContainer.appendChild(loadingIcon);
}

// Sends a message to the service worker to engage AI
function engageAI() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ action: 'engageAI' });
    } else {
      console.error('Service Worker not supported or not yet active.');
    }
}  

// Function to send a message
window.sendMessage = async function() {
    const functionName = "sendMessage";
    
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

        // Show typing indicator for AI after a delay of 2 seconds
        const typingIndicator = showTypingIndicator(chatBody);

        // Clear the message input field
        messageInput.value = '';

        try {
            // Extract the current conversation from the chat window
            const extractedConversation = extractChatConversation();
            const msg = 'Extracted conversation:' + extractedConversation;
            log(msg, config.verbosityLevel, 4, functionName);

            // Wait for 1 seconds before generating an AI response
            setTimeout(async () => {
                // Generate an AI response using LLM
                const aiResponse = await generateAIResponseToConversation(extractedConversation);

                if (aiResponse) {
                    // Remove the typing indicator
                    chatBody.removeChild(typingIndicator);

                    // Create a new AI message element with the selected response
                    const aiMessageElement = document.createElement('div');
                    aiMessageElement.classList.add('ai-message');
                    aiMessageElement.textContent = "AI: " + aiResponse;

                    // Append the new AI message element to the chat body
                    chatBody.appendChild(aiMessageElement);

                    // Scroll to the bottom of the chat body
                    chatBody.scrollTop = chatBody.scrollHeight;

                    // Get the key takeaway from the conversation
                    const takeaway = await getKeyTakeaway(extractedConversation, documentId, conversationId);
                    
                    // Set the tooltip for the chat header to be the concatenation of all takeaway contents
                    const chatHeader = document.getElementById('chat-header');
                    chatHeader.title = `Takeaway: ${takeaway}`;

                    // Engage the AI to respond (update and seek goals) the new user interaction
                    engageAI();
                    
                    // Load user response suggestions based on the updated conversation
                    showUserResponseSuggestionLoadingIndicator();
                    
                    const userResponseSuggestions = await generateDefaultAndSuggestedUserResponses(extractedConversation);
                    if (userResponseSuggestions) {
                        loadSuggestedUserChatResponses(userResponseSuggestions);
                    } else {
                        console.error('Failed to generate user response suggestions.');
                    }
                } else {
                    console.error('Failed to generate AI response.');
                }
            }, 1000); // 1 second delay
        } catch (error) {
            console.error('Error generating AI response:', error);
        }
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

function speakText(text, voiceName = null) {
    // Check if SpeechSynthesis API is available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice
      if (voiceName) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name === voiceName);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          console.warn('Voice not found. Using default voice.');
        }
      }
      
      speechSynthesis.speak(utterance);
    } else {
      console.error('Text-to-speech not supported in this browser.');
    }
  }

  
// Function to start voice-to-text
window.startVoiceToText = function() {
    console.log("Voice-to-text entry started");
}

// Function to handle when the chat dialog is opened
async function handleChatDialogOpen() {
    // Load user response suggestions based on the updated conversation
    showUserResponseSuggestionLoadingIndicator();

    // Extract the current conversation from the chat window
    const extractedConversation = extractChatConversation();
                        
    const userResponseSuggestions = await generateDefaultAndSuggestedUserResponses(extractedConversation);
    if (userResponseSuggestions) {
        loadSuggestedUserChatResponses(userResponseSuggestions);
    } else {
        console.error('Failed to generate user response suggestions.');
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
