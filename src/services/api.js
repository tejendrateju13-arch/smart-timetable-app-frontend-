import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://smart-timetable-app-backend.onrender.com/api'),
});

console.log("🔌 API Connected to:", api.defaults.baseURL);

// Mixed Content Detection
if (window.location.protocol === 'https:' && api.defaults.baseURL.startsWith('http://')) {
    console.error("🚨 MIXED CONTENT WARNING: You are running on HTTPS but trying to connect to an insecure HTTP backend (" + api.defaults.baseURL + "). Browsers typically BLOCK this request. Please configure VITE_API_BASE_URL to use HTTPS (e.g. your deployed backend) or run the frontend locally on HTTP.");
}

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        try {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        } catch (e) {
            console.error("[API] Failed to get token", e);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => response, (error) => {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        console.error("🚨 NETWORK ERROR DETECTED");
        console.error("Possible causes:");
        console.error("1. Backend is not running.");
        console.error("2. CORS policy blocks the request.");
        console.error("3. MIXED CONTENT: HTTPS frontend cannot talk to HTTP backend.");
        console.error("4. AD BLOCKER: Extension might be blocking '/api' requests (ERR_BLOCKED_BY_CLIENT).");
    }
    return Promise.reject(error);
});

export default api;
