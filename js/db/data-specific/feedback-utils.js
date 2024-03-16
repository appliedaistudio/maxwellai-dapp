import config from '../dapp-config.js';

// Initialize local PouchDB instance using the provided configuration
const localDb = new PouchDB(config.localDbName);

// Function to create a new feedback
async function createFeedback(feedback, docId) {
    try {
        // Retrieve the document containing feedbacks from the database
        const response = await localDb.get(docId);
        // Assign a unique ID to the new feedback
        feedback._id = response.feedback.length + 1;
        // Add the new feedback to the feedbacks array in the document
        response.feedback.push(feedback);
        // Update the document in the database
        await localDb.put(response);
        // Return the ID of the newly created feedback
        return feedback._id;
    } catch (error) {
        throw error;
    }
}

// Function to get all feedbacks
async function getAllFeedbacks(docId) {
    try {
        // Retrieve the document containing feedbacks from the database
        const response = await localDb.get(docId);
        // Return the array of feedbacks from the retrieved document
        return response.feedback;
    } catch (error) {
        throw error;
    }
}

// Function to get feedback by ID
async function getFeedbackById(feedbackId, docId) {
    try {
        // Retrieve the document containing feedbacks from the database
        const response = await localDb.get(docId);
        // Find the feedback with the specified ID in the feedbacks array
        const feedback = response.feedback.find(item => item._id === feedbackId);
        if (feedback) {
            return feedback;
        } else {
            throw new Error('Feedback not found');
        }
    } catch (error) {
        throw error;
    }
}

// Function to update a feedback
async function updateFeedback(feedback, docId) {
    try {
        // Retrieve the document containing feedbacks from the database
        const response = await localDb.get(docId);
        // Find the index of the feedback to be updated in the feedbacks array
        const index = response.feedback.findIndex(item => item._id === feedback._id);
        if (index !== -1) {
            // Update the feedback in the feedbacks array
            response.feedback[index] = feedback;
            // Save the updated document back to the database
            await localDb.put(response);
            return { updated: true };
        } else {
            throw new Error('Feedback not found');
        }
    } catch (error) {
        throw error;
    }
}

// Function to delete a feedback
async function deleteFeedback(feedbackId, docId) {
    try {
        // Retrieve the document containing feedbacks from the database
        const response = await localDb.get(docId);
        // Find the index of the feedback to be deleted in the feedbacks array
        const index = response.feedback.findIndex(item => item._id === feedbackId);
        if (index !== -1) {
            // Remove the feedback from the feedbacks array
            response.feedback.splice(index, 1);
            // Save the updated document back to the database
            await localDb.put(response);
            return { deleted: true };
        } else {
            throw new Error('Feedback not found');
        }
    } catch (error) {
        throw error;
    }
}

// Function to read all takeaways
async function readAllTakeaways(docId) {
    try {
        // Retrieve the document containing feedbacks from the database
        const response = await localDb.get(docId);
        // Extract all general takeaways from the feedbacks and return them as an array
        return response.feedback.map(item => item.takeaway.general);
    } catch (error) {
        throw error;
    }
}

// Export CRUD functions
export {
    createFeedback,
    getAllFeedbacks,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
    readAllTakeaways
};
