import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDepartment } from '../context/DepartmentContext';
import api from '../services/api';

import AdminDashboard from './admin/AdminDashboard';
import FacultyDashboard from './faculty/FacultyDashboard';
import StudentDashboard from './student/StudentDashboard';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { currentDept } = useDepartment();
    const [stats, setStats] = useState({ faculty: 0, subjects: 0, classrooms: 0 });

    // Role Checks
    const role = currentUser?.role;

    useEffect(() => {
        if (role === 'Admin' && currentDept) {
            fetchStats();
        }
    }, [currentDept, role]);

    const fetchStats = async () => {
        try {
            const [fRes, sRes, cRes] = await Promise.all([
                api.get(`/faculty?deptId=${currentDept.id}`),
                api.get(`/subjects?deptId=${currentDept.id}`),
                api.get('/classrooms')
            ]);
            setStats({
                faculty: fRes.data.length || 0,
                subjects: sRes.data.length || 0,
                classrooms: cRes.data.length || 0
            });
        } catch (err) {
            console.error("Error fetching dashboard stats", err);
        }
    };

    if (!currentUser) return <div>Loading Profile...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    Dashboard
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">v2.2 Multi-Role</span>
                </h1>
                {currentDept && role === 'Admin' && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Current Department: {currentDept.name}
                    </span>
                )}
            </div>

            {/* Traffic Control */}
            {role === 'Admin' && <AdminDashboard stats={stats} />}
            {role === 'HOD' && <AdminDashboard stats={stats} />}
            {role === 'Faculty' && <FacultyDashboard />}
            {role === 'Student' && <StudentDashboard />}
            {!['Admin', 'HOD', 'Faculty', 'Student'].includes(role) && (
                <div className="text-red-500">
                    Unknown Role: {role}. Please contact support.
                </div>
            )}
        </div>
    );
}
