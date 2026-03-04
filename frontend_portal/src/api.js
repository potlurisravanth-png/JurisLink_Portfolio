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
 * AG-UI Protocol: Stream a message via SSE.
 *
 * Opens a fetch-based SSE connection to /api/chat/stream and invokes
 * callbacks as StateSnapshot, StateDelta, and done events arrive.
 *
 * Uses fetch + ReadableStream instead of EventSource because EventSource
 * only supports GET, but our endpoint requires POST with a JSON body.
 *
 * @param {string} message - The user's message
 * @param {Array} history - Chat history for context
 * @param {Object} lastState - Previous backend state for hydration
 * @param {Object} callbacks - { onDelta, onSnapshot, onDone, onError }
 * @param {AbortSignal} signal - Optional AbortController signal
 */
export const sendMessageStream = async (message, history, lastState = null, callbacks = {}, signal = null) => {
    const { onDelta, onSnapshot, onDone, onError } = callbacks;
    const STREAM_URL = `${API_BASE}/chat/stream`;

    const body = { message, history };
    if (lastState) {
        body.previous_state = lastState;
    }

    try {
        const response = await fetch(STREAM_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal,
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`SSE stream failed (${response.status}): ${errText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE events from the buffer
            const parts = buffer.split("\n\n");
            buffer = parts.pop(); // Keep incomplete chunk in buffer

            for (const part of parts) {
                if (!part.trim()) continue;

                let eventType = "message";
                let eventData = "";

                for (const line of part.split("\n")) {
                    if (line.startsWith("event: ")) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith("data: ")) {
                        eventData = line.slice(6);
                    }
                }

                if (!eventData) continue;

                try {
                    const parsed = JSON.parse(eventData);

                    switch (eventType) {
                        case "StateDelta":
                            if (onDelta) onDelta(parsed);
                            break;
                        case "StateSnapshot":
                            if (onSnapshot) onSnapshot(parsed);
                            break;
                        case "done":
                            if (onDone) onDone(parsed);
                            return parsed; // Return final payload
                        case "error":
                            if (onError) onError(parsed);
                            throw new Error(parsed.error || "Stream error");
                        default:
                            break;
                    }
                } catch (parseErr) {
                    if (parseErr.message && !parseErr.message.includes("JSON")) {
                        throw parseErr; // Re-throw non-parse errors
                    }
                    console.warn("SSE parse warning:", parseErr);
                }
            }
        }
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("SSE stream cancelled by user");
            throw new Error("CANCELLED");
        }
        console.error("SSE Stream Error:", error);
        if (onError) onError({ error: error.message });
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
