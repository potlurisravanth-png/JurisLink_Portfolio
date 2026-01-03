import axios from 'axios';

// Use environment variable for flexibility, fallback to Azure production URL
const API_BASE = import.meta.env.VITE_API_URL?.replace('/chat', '') || "https://jurislink-api.azurewebsites.net/api";
const API_URL = `${API_BASE}/chat`;

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
        const response = await axios.post(`${API_BASE}/download_brief`, {
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

// =============================================================================
// SESSION API (Multi-User Support)
// =============================================================================

/**
 * Create axios config with auth headers
 */
const createAuthConfig = (idToken, userId) => ({
    headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
    },
    params: idToken?.startsWith('demo-token') ? { user_id: userId } : undefined
});

/**
 * Get all sessions for the current user.
 */
export const getUserSessions = async (idToken, userId) => {
    try {
        const config = createAuthConfig(idToken, userId);
        const response = await axios.get(`${API_BASE}/sessions`, config);
        return response.data.sessions || [];
    } catch (error) {
        console.error("Get Sessions Error:", error);
        // Fallback to localStorage if API fails
        return null;
    }
};

/**
 * Get a specific session by ID.
 */
export const getSession = async (idToken, userId, sessionId) => {
    try {
        const config = createAuthConfig(idToken, userId);
        const response = await axios.get(`${API_BASE}/sessions/${sessionId}`, config);
        return response.data.session;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        console.error("Get Session Error:", error);
        return null;
    }
};

/**
 * Save or update a session.
 */
export const saveSessionToAPI = async (idToken, userId, sessionId, data) => {
    try {
        const config = createAuthConfig(idToken, userId);
        const body = {
            session_id: sessionId,
            user_id: userId,
            ...data
        };
        await axios.post(`${API_BASE}/sessions`, body, config);
        return true;
    } catch (error) {
        console.error("Save Session Error:", error);
        return false;
    }
};

/**
 * Delete a session.
 */
export const deleteSessionFromAPI = async (idToken, userId, sessionId) => {
    try {
        const config = createAuthConfig(idToken, userId);
        await axios.delete(`${API_BASE}/sessions/${sessionId}`, config);
        return true;
    } catch (error) {
        console.error("Delete Session Error:", error);
        return false;
    }
};
