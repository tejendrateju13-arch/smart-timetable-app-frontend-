import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDepartment } from '../../context/DepartmentContext';
import api from '../../services/api';

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const { currentDept } = useDepartment();
    const [stats, setStats] = useState({ faculty: 0, subjects: 0, classrooms: 0 });

    useEffect(() => {
        if (currentDept) {
            fetchStats();
        }
    }, [currentDept]);

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

    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl">Welcome, <span className="font-bold text-blue-600">{currentUser?.displayName || currentUser?.name}</span></h2>
                <p className="text-gray-500 mt-1">Administrator Dashboard {currentDept && `- ${currentDept.name}`}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Cards */}
                <Link to="/admin/faculty" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Faculty</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.faculty}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/subjects" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Subjects</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.subjects}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/classrooms" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Classrooms</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.classrooms}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/generate" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">AI Engine</p>
                            <h3 className="text-lg font-bold mt-1 text-purple-600">Run Scheduler</h3>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/workload" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Analytics</p>
                            <h3 className="text-lg font-bold mt-1 text-indigo-600">Faculty Workload</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/leaves" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Requests</p>
                            <h3 className="text-lg font-bold mt-1 text-orange-600">Leaves</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/upload" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Data</p>
                            <h3 className="text-lg font-bold mt-1 text-teal-600">Upload Files</h3>
                        </div>
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                    </div>
                </Link>
                <Link to="/admin/attendance" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Daily Status</p>
                            <h3 className="text-lg font-bold mt-1 text-pink-600">Attendance</h3>
                        </div>
                        <div className="p-3 bg-pink-50 text-pink-600 rounded-lg group-hover:bg-pink-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/notifications" className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">System</p>
                            <h3 className="text-lg font-bold mt-1 text-gray-600">Notifications</h3>
                        </div>
                        <div className="p-3 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/settings" className="p-6 bg-white border border-red-100 rounded-xl shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-500 font-medium">Danger Zone</p>
                            <h3 className="text-lg font-bold mt-1 text-red-600">System Settings</h3>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>

        </div >
    );
}
