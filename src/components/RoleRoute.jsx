import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
    const { currentUser, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!currentUser) return <Navigate to="/login" />;

    // If roles are defined and user's role isn't included
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // Redirect to their meaningful dashboard to avoid dead ends
        if (currentUser.role === 'Admin' || currentUser.role === 'HOD') return <Navigate to="/admin-dashboard" />;
        if (currentUser.role === 'Faculty') return <Navigate to="/faculty-dashboard" />;
        if (currentUser.role === 'Student') return <Navigate to="/student-dashboard" />;
        return <Navigate to="/" />;
    }

    return children;
};

export default RoleRoute;
