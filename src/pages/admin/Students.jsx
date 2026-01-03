import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UniversalEditModal from '../../components/admin/UniversalEditModal';
import { useDepartment } from '../../context/DepartmentContext';
import StudentStatistics from '../../components/StudentStatistics';

export default function Students() {
    const { currentDept, loading: deptLoading } = useDepartment();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', studentId: '', email: '', departmentId: currentDept?.id || '', year: 1, semester: 1, section: 'A' });
    const [selectedYear, setSelectedYear] = useState(1);
    const [selectedSection, setSelectedSection] = useState('A');
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentDept?.id) {
            fetchStudents();
        }
    }, [currentDept?.id, selectedYear, selectedSection]);

    const fetchStudents = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get(`/students?departmentId=${currentDept.id}&year=${selectedYear}&section=${selectedSection}`);
            setStudents(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newStudent, departmentId: currentDept.id };
            const res = await api.post('/students', payload);
            setStudents(prev => [...prev, res.data]);
            setNewStudent({ name: '', studentId: '', email: '', departmentId: currentDept?.id || '', year: 1, semester: 1, section: 'A' });
        } catch (err) {
            console.error(err);
            alert('Failed to add student');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (updatedData) => {
        // Optimistic Update
        const originalStudents = [...students];
        setStudents(prev => prev.map(s => s.id === updatedData.id ? { ...s, ...updatedData } : s));
        setIsModalOpen(false);

        try {
            await api.put(`/students/${updatedData.id}`, updatedData);
            const res = await api.get(`/students?departmentId=${currentDept.id}&year=${selectedYear}&section=${selectedSection}`);
            setStudents(res.data);
        } catch (err) {
            console.error(err);
            setStudents(originalStudents); // Rollback
            alert('Failed to update student');
        }
    };

    const studentFields = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'studentId', label: 'Student ID / Roll No', type: 'text' },
        { name: 'year', label: 'Year', type: 'number' },
        { name: 'semester', label: 'Semester', type: 'number' },
        {
            name: 'section',
            label: 'Section',
            type: 'select',
            options: [
                { value: 'A', label: 'Section A' },
                { value: 'B', label: 'Section B' },
                { value: 'C', label: 'Section C' }
            ]
        }
    ];

    if (deptLoading) return <div className="p-8 text-center text-gray-500">Initializing department...</div>;
    if (!currentDept) return <div className="p-8 text-center text-gray-500">Department data not available.</div>;

    return (
        <div className="p-6">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    ARTIFICIAL INTELLIGENCE AND DATA SCIENCE (AI&DS)
                </h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Students - {currentDept?.name}</h2>

            <UniversalEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={editingItem}
                onSave={handleSaveEdit}
                title="Edit Student"
                fields={studentFields}
            />

            <div className="mb-8 p-6 bg-white rounded-lg shadow-md border-t-4 border-blue-500">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Student</h3>
                <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newStudent.name}
                            onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                        <input
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newStudent.studentId}
                            onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newStudent.email}
                            onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                            required
                            placeholder="student@example.com"
                        />
                    </div>
                    <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newStudent.year}
                            onChange={e => setNewStudent({ ...newStudent, year: parseInt(e.target.value) })}
                        >
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sem</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newStudent.semester}
                            onChange={e => setNewStudent({ ...newStudent, semester: parseInt(e.target.value) })}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newStudent.section}
                            onChange={e => setNewStudent({ ...newStudent, section: e.target.value })}
                        >
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-100">
                        Enroll Student
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="p-4 border-b bg-gray-50 border-gray-200 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <h3 className="font-semibold text-gray-700 mr-4">Student List</h3>
                        <div className="flex bg-gray-200 p-1 rounded-lg">
                            {[1, 2, 3, 4].map(y => (
                                <button
                                    key={y}
                                    onClick={() => setSelectedYear(y)}
                                    className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${selectedYear === y ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Year {y}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-gray-200 p-1 rounded-lg">
                            {['A', 'B', 'C'].map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => setSelectedSection(sec)}
                                    className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${selectedSection === sec ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Sec {sec}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                            Section {selectedSection}: {students.length} students
                        </span>
                    </div>
                </div>

                {/* Statistics Card */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                    <h4 className="text-xs font-black text-gray-400 uppercase mb-3">Department Statistics</h4>
                    <StudentStatistics departmentId={currentDept?.id} />
                </div>

                {!currentDept && loading ? (
                    <div className="p-16 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Fetching students...</p>
                    </div>
                ) : !currentDept ? (
                    <div className="p-16 text-center text-gray-400 bg-gray-50 rounded-xl">
                        <p className="text-lg font-bold text-gray-500 mb-2">Department data not available</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Fetching students for {currentDept.name}...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="p-16 text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-lg font-bold text-gray-500 mb-2">No students found</p>
                        <p className="text-sm">This department currently has no enrolled students.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-black tracking-widest leading-normal">
                            <tr>
                                <th className="p-4 border-b">Name</th>
                                <th className="p-4 border-b">Email</th>
                                <th className="p-4 border-b">Roll No</th>
                                <th className="p-4 border-b">Year</th>
                                <th className="p-4 border-b">Semester</th>
                                <th className="p-4 border-b">Section</th>
                                <th className="p-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-medium">
                            {students.map((s, index) => (
                                <tr key={s.id || index} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 border-l-4 border-transparent hover:border-blue-500 font-bold">{s.name}</td>
                                    <td className="p-4 text-xs text-gray-500">{s.email}</td>
                                    <td className="p-4 font-mono text-xs">{s.studentId}</td>
                                    <td className="p-4">{s.year} Year</td>
                                    <td className="p-4">Sem {s.semester}</td>
                                    <td className="p-4">
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-black text-[10px]">SEC {s.section || 'A'}</span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-3">
                                        <button
                                            onClick={() => handleEdit(s)}
                                            className="text-blue-600 hover:text-blue-800 font-bold"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Delete this student?')) {
                                                    const originalStudents = [...students];
                                                    // Optimistic Delete
                                                    setStudents(prev => prev.filter(item => item.id !== s.id));

                                                    try {
                                                        await api.delete(`/students/${s.id}`);
                                                    } catch (err) {
                                                        console.error(err);
                                                        setStudents(originalStudents); // Rollback
                                                        alert('Failed to delete student');
                                                    }
                                                }
                                            }}
                                            className="text-red-400 hover:text-red-600 font-bold"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
