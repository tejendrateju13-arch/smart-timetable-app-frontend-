import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [token, setToken] = useState(searchParams.get('token') || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return setError("Passwords don't match");
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            await api.post('/auth/reset-password', { email, token, newPassword });
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Reset Password</h2>

                {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{message}</div>}
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Confirm your email"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Reset Token</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                            placeholder="Enter token from email/console"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                        <input
                            type="password"
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="New Password"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm Password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Reseting...' : 'Reset Password'}
                    </button>

                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm text-blue-500 hover:underline">Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
