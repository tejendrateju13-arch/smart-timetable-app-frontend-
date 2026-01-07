import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

console.log("🔌 API Connected to:", api.defaults.baseURL);

// Mixed Content Detection
if (window.location.protocol === 'https:' && api.defaults.baseURL.startsWith('http://')) {
    console.error("🚨 MIXED CONTENT WARNING: You are running on HTTPS but trying to connect to an insecure HTTP backend (" + api.defaults.baseURL + "). Browsers typically BLOCK this request. Please configure VITE_API_BASE_URL to use HTTPS (e.g. your deployed backend) or run the frontend locally on HTTP.");
}

api.interceptors.request.use(async (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

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

export default api;
