import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket, socket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Login Function
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setCurrentUser(user);
            connectSocket(token); // Connect Socket
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    // Register Function
    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Register Error:", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    // Logout Function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        disconnectSocket(); // Disconnect Socket
    };

    // Check Auth State on Mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Start by checking localStorage user for instant UI
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setCurrentUser(JSON.parse(storedUser));
                        connectSocket(token); // Reconnect Socket
                    }

                    // Verify with backend and update details
                    // Assuming /auth/profile returns the full user object
                    const response = await api.get('/auth/profile');
                    setCurrentUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));

                    if (!socket.connected) connectSocket(token);
                } catch (error) {
                    console.error("Auth Verification Failed:", error);
                    // If 401, interceptor might handle it, but being safe:
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setCurrentUser(null);
                    disconnectSocket();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const value = {
        currentUser,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-xl font-semibold text-blue-600">Loading Application...</div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
