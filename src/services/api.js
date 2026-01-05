import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://smart-timetable-app-backend.onrender.com/api'),
});
console.log("🔌 API Connected to:", api.defaults.baseURL);
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        // Force refresh to handle expiration/revocation edge cases
        // Use true to force refresh if we suspect issues, or false usually.
        // Let's print the token to see if it exists.
        try {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
            // console.log(`[API] Attached Token for ${user.email}`);
        } catch (e) {
            console.error("[API] Failed to get token", e);
        }
    } else {
        console.warn("[API] No User Logged In - Request might fail:", config.url);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
