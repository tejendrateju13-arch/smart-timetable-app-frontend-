import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function LeaveRequests() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/leaves');
            setLeaves(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching leaves", error);
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await api.put(`/leaves/${id}/status`, { status });
            // Optimistic update
            setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading requests...</div>;

    return (
        <div className="container mx-auto">
            <h2 className="text-2xl font-bold mb-6">Leave Requests</h2>
            <div className="bg-white shadow-md rounded overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Faculty</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applied At</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map((leave) => (
                            <tr key={leave.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap font-medium">{leave.facultyName}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{leave.startDate} to {leave.endDate}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{leave.reason}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{new Date(leave.appliedAt).toLocaleDateString()}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${leave.status === 'Approved' ? 'bg-green-200 text-green-900' :
                                            leave.status === 'Rejected' ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'
                                        }`}>
                                        <span className="relative">{leave.status}</span>
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {leave.status === 'Pending' && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleAction(leave.id, 'Approved')}
                                                className="text-green-600 hover:text-green-900 font-bold"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(leave.id, 'Rejected')}
                                                className="text-red-600 hover:text-red-900 font-bold"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {leaves.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                    No leave requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
