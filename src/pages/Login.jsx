import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser && currentUser.role) {
            if (currentUser.role === 'Admin' || currentUser.role === 'HOD') navigate('/admin-dashboard');
            else if (currentUser.role === 'Faculty') navigate('/faculty-dashboard');
            else if (currentUser.role === 'Student') navigate('/student-dashboard');
            // If role exists but is unknown, we stay here.
        } else if (currentUser) {
            // User exists but NO ROLE? This blocks the loop.
            console.warn("User logged in but has no role:", currentUser);
        }
    }, [currentUser, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Removed redundant check-email call to avoid 404s if backend is slightly out of sync.
            // Firebase Auth handles validation securely.


            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Validate Role by fetching profile
            // Interceptor handles the token
            await api.get('/auth/profile');

            // Navigation handled by useEffect
        } catch (err) {
            console.error("Login Error:", err);
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError(err.message || 'Login failed. Please check your credentials.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-sans text-gray-900">
            <div className="w-full max-w-lg p-10 bg-white rounded-3xl shadow-2xl border border-white/50 backdrop-blur-sm">
                <div className="text-center mb-10">
                    <div className="inline-block p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                        <span className="text-3xl text-white font-black">S</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Scheduler Pro</h1>
                    <p className="text-gray-400 mt-2 font-medium">Smart Timetable & Classroom Management</p>
                </div>

                {/* Identity Confirmation Removed as per user request */}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs mb-8 border border-red-100 text-center font-bold animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest transition-colors group-focus-within:text-blue-600">Official Access ID</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none font-medium placeholder:text-gray-300"
                                placeholder="name@college.edu"
                                required
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest transition-colors group-focus-within:text-blue-600">Security Passcode</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none font-medium placeholder:text-gray-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-blue-600 transform hover:-translate-y-1 transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-3"
                    >
                        Enter System
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                </form>

                <div className="mt-10 flex justify-center text-[11px] font-black uppercase tracking-widest text-gray-300">
                    <Link to="/forgot-password" title="Recover Access" className="hover:text-blue-600 transition-colors">Forgot Access?</Link>
                </div>
            </div>
        </div>
    );
}
