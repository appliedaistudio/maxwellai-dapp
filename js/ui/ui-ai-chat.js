import config from '../dapp-config.js';


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
    // You need to implement logic to fetch suggestions based on the selected category
    // For now, let's assume we have predefined sets of suggestions for different categories
    var suggestions = {
        'current projects': ["I want to update you on my progress.", "I'd like feedback on my latest work.", "I want to talk about a challenge I'm facing"],
        'inspiration and ideas': ["I'd like to share a new writing prompt.", "I'd like to explore a creative spark.", "I want to brainstorm on plot twists and characters."],
        'support and feedback': ["I need some encouragement.", "I need help getting past my writer's block.", "I need help staying motivated."]
    };

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

        // Clear the message input field
        messageInput.value = '';
    }
}

// Function to start voice-to-text
window.startVoiceToText = function() {
    console.log("Voice-to-text entry started");
}

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
const chatModal = document.getElementById('chatModal');
chatModal.addEventListener('hidden.bs.modal', saveChatConversation);
