import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDepartment } from '../context/DepartmentContext';
import { Link, Outlet } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

export default function Layout() {
    const { currentUser, logout } = useAuth();
    const { currentDept, departments, switchDepartment, loading: loadingContext } = useDepartment();
    const isAdmin = currentUser?.role === 'Admin';
    const isHOD = currentUser?.role === 'HOD';
    const isFaculty = currentUser?.role === 'Faculty';

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Header (Hamburger) - Visible only on mobile */}
            <div className="md:hidden fixed top-0 w-full bg-white shadow-sm z-30 flex items-center justify-between px-4 py-3 h-16">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
                >
                    {/* Hamburger Icon */}
                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="font-bold text-blue-600 text-lg">Scheduler</span>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            {/* Mobile Overlay (Backdrop) */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="p-6 h-full overflow-y-auto flex flex-col">
                    <div className="flex items-center justify-between md:block mb-6 md:mb-0">
                        {/* Desktop Header */}
                        <div className="hidden md:block">
                            <h1 className="text-2xl font-bold text-blue-600">Scheduler</h1>
                            <p className="text-sm text-gray-500 mt-2">Welcome, {currentUser?.displayName || currentUser?.name}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{currentUser?.role}</span>
                        </div>

                        {/* Mobile Header in Sidebar */}
                        <div className="md:hidden">
                            <h1 className="text-xl font-bold text-blue-600">Menu</h1>
                        </div>

                        {/* Mobile Close Button (X) */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>


                    {/* Mobile Profile Info - Visible only in Sidebar on mobile */}
                    <div className="md:hidden mb-6">
                        <p className="font-bold text-gray-800">{currentUser?.displayName || currentUser?.name}</p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{currentUser?.role}</span>
                    </div>

                    {isHOD && currentDept && (
                        <div className="mt-4 p-2 bg-blue-50 rounded border border-blue-100">
                            <p className="text-[10px] text-blue-500 font-bold uppercase">Assigned Dept</p>
                            <p className="text-sm font-bold text-blue-800">{currentDept.name}</p>
                        </div>
                    )}

                    <div className="mt-4">
                        <NotificationCenter />
                    </div>

                    <nav className="mt-6 flex-1">
                        <Link to="/" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1">Dashboard</Link>

                        {(isAdmin || isHOD) && (
                            <>
                                <Link to="/admin/departments" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1 text-teal-600 font-medium">Departments</Link>
                                <Link to="/admin/subjects" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1">Subjects</Link>
                                <Link to="/admin/faculty" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1">Faculty</Link>
                                <Link to="/admin/students" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1">Students</Link>
                                <Link to="/admin/classrooms" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1">Classrooms</Link>
                                <Link to="/admin/generate" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1 text-blue-600 font-medium">AI Generation</Link>
                                <Link to="/admin/upload" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1">Upload Data</Link>
                                <Link to="/admin/config" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1 text-purple-600 font-medium">Timing Slots</Link>
                                <div className="border-t my-2 border-gray-200"></div>
                                <Link to="/admin/leaves" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1 text-orange-600">Leave Requests</Link>
                                <Link to="/admin/attendance" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1 text-green-600">Daily Attendance</Link>
                                <Link to="/admin/workload" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1 text-indigo-600">Workload Analytics</Link>
                            </>
                        )}

                        <Link to="/timetable" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 hover:bg-gray-100 rounded-lg mb-1">View Timetable</Link>

                        <button
                            onClick={() => {
                                setSidebarOpen(false);
                                logout();
                            }}
                            className="block w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg mt-4"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto pt-20 md:pt-8 w-full">
                <Outlet />
            </main>
        </div>
    );
}
