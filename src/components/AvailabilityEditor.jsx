import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AvailabilityEditor() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const slots = [1, 2, 3, 4, 5, 6, 7]; // Removed 8

    // Matrix: 5 days x 8 slots. true = available, false = unavailable
    const [matrix, setMatrix] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const profileRes = await api.get('/auth/profile');
            // Check for both legacy and new structure
            const availRes = await api.get('/faculty/my-availability');

            if (availRes && availRes.data && availRes.data.availability && Object.keys(availRes.data.availability).length > 0) {
                setMatrix(availRes.data.availability);
            } else {
                initializeDefaultMatrix();
            }
        } catch (err) {
            console.error("Failed to load availability", err);
            initializeDefaultMatrix();
        } finally {
            setLoading(false);
        }
    };

    const initializeDefaultMatrix = () => {
        const initial = {};
        days.forEach(d => {
            initial[d] = {};
            slots.forEach(s => initial[d][s] = true);
        });
        setMatrix(initial);
    };

    const toggleSlot = (day, slot) => {
        setMatrix(prev => {
            const dayRow = prev[day] || {};
            return {
                ...prev,
                [day]: {
                    ...dayRow,
                    [slot]: !dayRow[slot] // This will be true if undefined (because undefined is falsy-ish? No !undefined is true)
                }
            };
        });
    };

    const saveAvailability = async () => {
        setSaving(true);
        try {
            await api.put('/faculty/my-availability', { availability: matrix });
            setMessage('Availability saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error("Save Error Details:", err);
            if (err.response) {
                console.error("Server Response:", err.response.status, err.response.data);
                setMessage(`Failed to save: ${err.response.data?.message || 'Server Error'}`);
            } else {
                setMessage('Failed to save: Network or Client Error');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading Availability...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Weekly Availability</h3>
            {message && <div className={`p-2 mb-4 rounded ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

            <p className="text-sm text-gray-500 mb-4">Click cells to toggle availability. <span className="text-green-600 font-bold">Green = Available</span>, <span className="text-red-400">Red = Busy</span></p>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border bg-gray-50">Day \ Slot</th>
                            {slots.map(s => <th key={s} className="p-2 border bg-gray-50">Slot {s}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {days.map(day => (
                            <tr key={day}>
                                <td className="p-2 border font-medium bg-gray-50">{day}</td>
                                {slots.map(slot => {
                                    const isAvailable = matrix[day]?.[slot] !== false; // Default true
                                    return (
                                        <td
                                            key={slot}
                                            onClick={() => toggleSlot(day, slot)}
                                            className={`p-2 border text-center cursor-pointer transition-colors ${isAvailable ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'}`}
                                        >
                                            {isAvailable ? '✓' : 'Busy'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={saveAvailability}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Availability'}
                </button>
            </div>
        </div>
    );
}
