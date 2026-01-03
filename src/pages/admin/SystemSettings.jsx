import React, { useState } from 'react';
import api from '../../services/api'; // Adjust path
import { useAuth } from '../../context/AuthContext';
import { useDepartment } from '../../context/DepartmentContext'; // If HOD needs context
import { Trash2, AlertTriangle, UserX, BellOff, CalendarX, FileWarning } from 'lucide-react';

export default function SystemSettings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleDelete = async (type, confirmMsg, endpoint, params = {}) => {
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        setMessage(null);
        try {
            const res = await api.delete(endpoint, { params });
            setMessage({ type: 'success', text: res.data.message });
        } catch (error) {
            console.error("Delete Error:", error);
            setMessage({ type: 'error', text: error.response?.data?.message || "Deletion failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">System Settings & Danger Zone</h1>
            <p className="text-gray-500 mb-8">Manage critical system data. Actions here are irreversible.</p>

            {message && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Timetables */}
                <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <CalendarX size={24} />
                        <h2 className="text-xl font-bold">Timetables</h2>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Clear generated timetables. This will remove all published schedules.
                    </p>
                    <button
                        onClick={() => handleDelete('timetables', "WARNING: This will delete ALL timetables! Are you sure?", "/admin/timetables")}
                        className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Delete All Timetables'}
                    </button>
                    {/* Add Department specific if needed */}
                </div>

                {/* 2. Rearrangements */}
                <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-4 text-orange-600">
                        <FileWarning size={24} />
                        <h2 className="text-xl font-bold">Rearrangements</h2>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Clear substitution history. Fixes "stuck" absences or stale overrides.
                    </p>
                    <button
                        onClick={() => handleDelete('rearrangements', "Delete all rearrangement/substitution requests? This fixes 'stuck' absences.", "/admin/rearrangements")}
                        className="w-full py-2 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium transition"
                        disabled={loading}
                    >
                        Delete All Requests
                    </button>
                </div>

                {/* 3. Notifications */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-4 text-gray-700">
                        <BellOff size={24} />
                        <h2 className="text-xl font-bold">Notifications</h2>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Clear all system notifications for users.
                    </p>
                    <button
                        onClick={() => handleDelete('notifications', "Clear all system notifications?", "/admin/notifications")}
                        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
                        disabled={loading}
                    >
                        Clear Notifications
                    </button>
                </div>

                {/* 4. Users (Admin Only usually) */}
                {currentUser?.role === 'admin' && (
                    <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-4 text-red-800">
                            <UserX size={24} />
                            <h2 className="text-xl font-bold">Users</h2>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Bulk delete users. Use with extreme caution.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleDelete('students', "Delete ALL STUDENTS? This cannot be undone.", "/admin/users", { role: 'student' })}
                                className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                            >
                                Delete Students
                            </button>
                            <button
                                onClick={() => handleDelete('faculty', "Delete ALL FACULTY? This cannot be undone.", "/admin/users", { role: 'faculty' })}
                                className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                            >
                                Delete Faculty
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
