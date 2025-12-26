import axios from 'axios';

const API_URL = "http://localhost:7071/api/chat";

export const sendMessage = async (message, history, language = 'en') => {
    try {
        const response = await axios.post(API_URL, {
            message: message,
            history: history,
            language: language
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
