import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AvailabilityEditor from '../../components/AvailabilityEditor'; // Ensure this component exists and works
// If AvailabilityEditor is missing, we might need to create it, but assuming it exists based on previous file reads.

export default function FacultyDashboard() {
    const [attendanceToday, setAttendanceToday] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLeaveForm, setShowLeaveForm] = useState(false);

    // Leave Form State
    const [leaveData, setLeaveData] = useState({ startDate: '', endDate: '', reason: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];

            // Check attendance history
            try {
                const historyRes = await api.get('/attendance/my-history');
                const marked = historyRes.data.some(entry => entry.date === todayStr);
                setAttendanceToday(marked);
            } catch (e) { console.warn("Attendance fetch failed", e); }

            // Fetch leaves
            try {
                const leavesRes = await api.get('/leaves/my-leaves');
                setLeaves(leavesRes.data || []);
            } catch (e) { console.warn("Leaves fetch failed", e); }

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async () => {
        try {
            await api.post('/attendance', { status: 'Present', date: new Date().toISOString() });
            setAttendanceToday(true);
            setMessage('Attendance marked successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || 'Failed'));
        }
    };

    const submitLeave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/leaves', leaveData);
            setShowLeaveForm(false);
            setMessage('Leave application submitted.');
            setLeaveData({ startDate: '', endDate: '', reason: '' });
            fetchDashboardData(); // Refresh list
        } catch (error) {
            alert('Failed to submit leave');
        }
    };

    if (loading) return <div>Loading Dashboard...</div>;

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h2>
            {message && <div className="p-3 bg-blue-100 text-blue-800 rounded">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-xl font-semibold mb-4">Daily Attendance</h3>
                    {attendanceToday ? (
                        <div className="text-center py-4">
                            <span className="text-4xl">✅</span>
                            <p className="text-green-600 font-bold mt-2">Marked for Today</p>
                            <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="mb-4 text-gray-600">You haven't marked attendance yet.</p>
                            <button
                                onClick={markAttendance}
                                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition shadow-lg"
                            >
                                Mark Present
                            </button>
                        </div>
                    )}
                </div>

                {/* Leave Management Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Leave Management</h3>
                        <button
                            onClick={() => setShowLeaveForm(!showLeaveForm)}
                            className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200"
                        >
                            {showLeaveForm ? 'Cancel' : '+ Apply Leave'}
                        </button>
                    </div>

                    {showLeaveForm ? (
                        <form onSubmit={submitLeave} className="space-y-3 animate-fade-in">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">Start Date</label>
                                    <input type="date" required className="w-full border p-1 rounded"
                                        value={leaveData.startDate} onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">End Date</label>
                                    <input type="date" required className="w-full border p-1 rounded"
                                        value={leaveData.endDate} onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })} />
                                </div>
                            </div>
                            <textarea placeholder="Reason for leave..." required className="w-full border p-2 rounded text-sm"
                                value={leaveData.reason} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}></textarea>
                            <button type="submit" className="w-full bg-orange-500 text-white py-1.5 rounded hover:bg-orange-600 font-bold">Submit Application</button>
                        </form>
                    ) : (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-500">Recent Applications</h4>
                            {leaves.length === 0 ? <p className="text-sm text-gray-400">No leave history.</p> : (
                                <ul className="max-h-40 overflow-y-auto space-y-2">
                                    {leaves.map(leave => (
                                        <li key={leave.id || Math.random()} className="text-sm border-b pb-1">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{leave.startDate} <span className="text-gray-400">to</span> {leave.endDate}</span>
                                                <span className={`px-2 rounded-full text-[10px] font-bold ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    leave.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>{leave.status}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{leave.reason}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Availability Editor Section - Prominent */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500">
                <h3 className="text-xl font-bold text-gray-800 mb-2">My Availability & Preferences</h3>
                <p className="text-gray-500 mb-6 text-sm">Update your preferred slots. The AI scheduler will try to respect these when generating future timetables.</p>

                <AvailabilityEditor />
            </div>
        </div>
    );
}
