import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://smart-timetable-app-backend.onrender.com/api'),
});
console.log("🔌 API Connected to:", api.defaults.baseURL);
api.interceptors.request.use(async (config) => {
<<<<<<< HEAD
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
=======
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
>>>>>>> e5b44e53d904bdb87f4e29e821d54f0a886059bf
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

<<<<<<< HEAD
api.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        // Token expired or invalid
        // Avoid infinite loop if already on login page
        if (!window.location.pathname.includes('/login')) {
            console.warn("Session expired, redirecting to login.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

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

=======
>>>>>>> e5b44e53d904bdb87f4e29e821d54f0a886059bf
export default api;
