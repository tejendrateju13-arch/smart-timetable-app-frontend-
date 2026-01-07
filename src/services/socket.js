import io from 'socket.io-client';

// Initialize socket connection
// We use the same base URL as API, or explicitly set it
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
    autoConnect: false, // Wait for auth
    reconnection: true,
});

export const connectSocket = (token) => {
    if (token) {
        socket.auth = { token };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
