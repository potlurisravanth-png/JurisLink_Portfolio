import axios from 'axios';

// Use environment variable for flexibility, fallback to Azure production URL
const API_URL = import.meta.env.VITE_API_URL || "https://jurislink-api.azurewebsites.net/api/chat";

/**
 * Send a message to the JurisLink backend.
 * @param {string} message - The user's message
 * @param {Array} history - Chat history for context
 * @param {Object} lastState - Previous backend state for hydration
 * @param {AbortSignal} signal - Optional AbortController signal for cancellation
 * @returns {Promise<Object>} - Backend response with final_state
 */
export const sendMessage = async (message, history, lastState = null, signal = null) => {
    try {
        const body = {
            message: message,
            history: history,
        };

        // Include previous state for memory hydration
        if (lastState) {
            body.previous_state = lastState;
        }

        const config = {
            timeout: 120000,  // 2 minute timeout for full chain
        };

        // Add abort signal if provided
        if (signal) {
            config.signal = signal;
        }

        const response = await axios.post(API_URL, body, config);
        return response.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log("Request cancelled by user");
            throw new Error("CANCELLED");
        }
        console.error("API Error:", error);
        throw error;
    }
};

/**
 * Request a PDF download (generates if missing).
 */
export const downloadPDF = async (userId, caseId, facts, strategy, research) => {
    try {
        // Use base URL from API_URL, replace path
        const baseUrl = API_URL.replace('/chat', '');
        const response = await axios.post(`${baseUrl}/download_brief`, {
            user_id: userId,
            case_id: caseId,
            facts,
            strategy,
            research
        }, {
            responseType: 'blob' // Important for binary data
        });
        return response.data;
    } catch (error) {
        console.error("PDF Download Error:", error);
        throw error;
    }
};
