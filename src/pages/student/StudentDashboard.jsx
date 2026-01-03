import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
    const { currentUser } = useAuth();

    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl">Welcome, <span className="font-bold text-orange-600">{currentUser?.displayName || currentUser?.name}</span></h2>
                <p className="text-gray-500 mt-1">Student Portal - Section {currentUser?.section || 'A'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-2">Class Timetable</h3>
                    <p className="text-gray-600 mb-4">Check your upcoming classes for today.</p>
                    <Link to="/timetable" className="inline-block px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium shadow-sm">View Timetable</Link>
                </div>
            </div>
        </div>
    );
}
