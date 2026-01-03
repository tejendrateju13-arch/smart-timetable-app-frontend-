import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FacultyStatusWidget = ({ currentUser }) => {
    const [status, setStatus] = useState('Present');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const markAttendance = async (newStatus) => {
        setLoading(true);
        setMessage('');
        try {
            const today = new Date().toISOString().split('T')[0];
            await api.post('/attendance', {
                date: today,
                status: newStatus
            });
            setStatus(newStatus);
            setMessage(`Marked as ${newStatus}`);
        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    if (currentUser.role !== 'Faculty') return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6 flex items-center justify-between gap-4">
            <div>
                <h4 className="font-bold text-gray-800">My Status Today</h4>
                <p className="text-xs text-gray-500">Marking absent will trigger auto-rearrangement.</p>
            </div>

            <div className="flex items-center gap-2">
                {['Present', 'Absent', 'On Duty'].map((s) => (
                    <button
                        key={s}
                        onClick={() => markAttendance(s)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${status === s
                                ? (s === 'Absent' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200')
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            {message && <span className="text-xs font-semibold text-blue-600 animate-pulse">{message}</span>}
        </div>
    );
};

export default FacultyStatusWidget;
