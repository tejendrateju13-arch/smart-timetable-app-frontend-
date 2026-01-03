import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DepartmentProvider } from './context/DepartmentContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

import Layout from './components/Layout';
import Departments from './pages/admin/Departments';
import Subjects from './pages/admin/Subjects';
import Faculty from './pages/admin/Faculty';
import Classrooms from './pages/admin/Classrooms';
import Generate from './pages/admin/Generate';
import UploadData from './pages/admin/UploadData';
import Students from './pages/admin/Students';
import Timetable from './pages/admin/Timetable';
import WorkloadAnalytics from './pages/admin/WorkloadAnalytics';
import LeaveRequests from './pages/admin/LeaveRequests';
import AttendanceView from './pages/admin/AttendanceView';
import PerformanceConfig from './pages/admin/PerformanceConfig';
import Notifications from './pages/admin/Notifications';
import SystemSettings from './pages/admin/SystemSettings';

const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return currentUser ? children : <Navigate to="/login" />;
};

const RoleRedirector = () => {
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!loading && currentUser) {
            if (currentUser.role === 'Admin' || currentUser.role === 'HOD') navigate('/admin-dashboard');
            else if (currentUser.role === 'Faculty') navigate('/faculty-dashboard');
            else if (currentUser.role === 'Student') navigate('/student-dashboard');
            else navigate('/login');
        }
    }, [currentUser, loading, navigate]);

    if (loading) return <div>Redirecting...</div>;
    return null;
};

import RoleRoute from './components/RoleRoute';

function App() {
    return (
        <AuthProvider>
            <DepartmentProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />

                        <Route path="/" element={
                            <PrivateRoute>
                                <Layout />
                            </PrivateRoute>
                        }>
                            {/* Role Redirector at Root */}
                            <Route index element={<RoleRedirector />} />

                            {/* Explicit Dashboard Routes */}
                            <Route path="admin-dashboard" element={<RoleRoute allowedRoles={['Admin', 'HOD']}><AdminDashboard /></RoleRoute>} />
                            <Route path="faculty-dashboard" element={<RoleRoute allowedRoles={['Faculty']}><FacultyDashboard /></RoleRoute>} />
                            <Route path="student-dashboard" element={<RoleRoute allowedRoles={['Student']}><StudentDashboard /></RoleRoute>} />

                            {/* Admin & HOD Routes */}
                            <Route path="admin" element={<RoleRoute allowedRoles={['Admin', 'HOD']}><Outlet /></RoleRoute>}>
                                <Route path="departments" element={<Departments />} />
                                <Route path="subjects" element={<Subjects />} />
                                <Route path="faculty" element={<Faculty />} />
                                <Route path="students" element={<Students />} />
                                <Route path="classrooms" element={<Classrooms />} />

                                <Route path="upload" element={<UploadData />} />
                                <Route path="generate" element={<Generate />} />
                                <Route path="leaves" element={<LeaveRequests />} />
                                <Route path="attendance" element={<AttendanceView />} />
                                <Route path="workload" element={<WorkloadAnalytics />} />
                                <Route path="config" element={<PerformanceConfig />} />
                                <Route path="notifications" element={<Notifications />} />
                                <Route path="settings" element={<SystemSettings />} />
                            </Route>

                            {/* Shared/Public within Auth */}
                            <Route path="timetable" element={<Timetable />} />
                        </Route>
                    </Routes>
                </Router>
            </DepartmentProvider>
        </AuthProvider>
    );
}

export default App;
