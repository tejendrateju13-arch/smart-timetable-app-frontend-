import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login, currentUser } = useAuth();

    useEffect(() => {
        if (currentUser && currentUser.role) {
            if (currentUser.role === 'Admin' || currentUser.role === 'HOD') navigate('/admin-dashboard');
            else if (currentUser.role === 'Faculty') navigate('/faculty-dashboard');
            else if (currentUser.role === 'Student') navigate('/student-dashboard');
        } else if (currentUser) {
            console.warn("User logged in but has no role:", currentUser);
        }
    }, [currentUser, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const result = await login(email, password);

        if (!result.success) {
            setError(result.message);
        }
        // If success, useEffect will handle navigation
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
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none font-medium placeholder:text-gray-300 pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
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
