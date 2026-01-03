import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            try {
                if (user) {
                    // Get the ID token to authenticate the backend request
                    const token = await user.getIdToken();

                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const profile = await response.json();
                        setCurrentUser({ ...user, ...profile }); // Merge Auth user with Firestore profile
                    } else {
                        console.error('Failed to fetch user profile');
                        setCurrentUser(user);
                    }
                } else {
                    setCurrentUser(null);
                }
            } catch (err) {
                console.error("Error in Auth State Change:", err);
                if (user) setCurrentUser(user);
                else setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading
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
