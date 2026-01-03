import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DepartmentContext = createContext();

export const useDepartment = () => useContext(DepartmentContext);

export const DepartmentProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [currentDept, setCurrentDept] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchDepartments();
        } else {
            setDepartments([]);
            setLoading(false);
        }
    }, [currentUser?.uid]);

    const fetchDepartments = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/departments');
            const allDepts = res.data;
            setDepartments(allDepts);

            if (allDepts.length > 0) {
                // Determine current dept based on role
                let targetDept = null;

                if (currentUser && currentUser.role === 'HOD' && currentUser.departmentId) {
                    targetDept = allDepts.find(d => d.id === currentUser.departmentId);
                } else if (currentUser && currentUser.role === 'Faculty' && currentUser.departmentId) {
                    targetDept = allDepts.find(d => d.id === currentUser.departmentId);
                } else {
                    // Default for Admin or others: Try to find AI&DS or use localStorage
                    const savedId = localStorage.getItem('selectedDeptId');
                    targetDept = allDepts.find(d => d.id === savedId) ||
                        allDepts.find(d => d.name.includes('AI&DS') || d.name.toLowerCase().includes('artificial intelligence')) ||
                        allDepts[0];
                }

                if (targetDept) {
                    setCurrentDept(targetDept);
                    localStorage.setItem('selectedDeptId', targetDept.id);
                }
            }
        } catch (error) {
            console.error("Failed to load departments", error);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    const switchDepartment = (deptId) => {
        // Only allow switching if explicitly needed, but for now it's locked to AI&DS
        const dept = departments.find(d => d.id === deptId);
        if (dept) {
            setCurrentDept(dept);
            localStorage.setItem('selectedDeptId', deptId);
        }
    };

    return (
        <DepartmentContext.Provider value={{ currentDept, departments, switchDepartment, loading, refreshDepartments: fetchDepartments }}>
            {children}
        </DepartmentContext.Provider>
    );
};
