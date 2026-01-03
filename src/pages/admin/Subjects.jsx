import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UniversalEditModal from '../../components/admin/UniversalEditModal';
import { useDepartment } from '../../context/DepartmentContext';

export default function Subjects() {
    const { currentDept, loading: deptLoading } = useDepartment();
    const [subjects, setSubjects] = useState([]);
    const [deptList, setDeptList] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: '', departmentId: currentDept?.id || '', type: 'Theory', code: '', year: 1, semester: 1, facultyName: '' });
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentDept?.id) {
            console.log("Subjects page currentDept:", currentDept.id);
            fetchInitialData();
        }
    }, [currentDept?.id]);

    const fetchInitialData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [subRes, deptRes, facultyRes] = await Promise.all([
                api.get(`/subjects?departmentId=${currentDept.id}`),
                api.get('/departments'),
                api.get(`/faculty?departmentId=${currentDept.id}`)
            ]);
            setSubjects(subRes.data);
            setDeptList(deptRes.data);
            setFacultyList(facultyRes.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/subjects', newSubject);
            setSubjects(prev => [...prev, res.data]);
            setNewSubject({ name: '', departmentId: currentDept?.id || '', type: 'Theory', code: '', year: 1, semester: 1, facultyName: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to add subject');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (updatedData) => {
        // Optimistic Update
        const originalSubjects = [...subjects];
        setSubjects(prev => prev.map(s => s.id === updatedData.id ? { ...s, ...updatedData } : s));
        setIsModalOpen(false);

        try {
            await api.put(`/subjects/${updatedData.id}`, updatedData);
            const res = await api.get(`/subjects?departmentId=${currentDept.id}`);
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
            setSubjects(originalSubjects); // Rollback
            alert('Failed to update subject');
        }
    };

    const subjectFields = [
        { name: 'name', label: 'Subject Name', type: 'text' },
        { name: 'code', label: 'Subject Code', type: 'text' },
        {
            name: 'departmentId',
            label: 'Department',
            type: 'select',
            options: deptList.map(d => ({ value: d.id, label: d.name }))
        },
        {
            name: 'year',
            label: 'Year',
            type: 'select',
            options: [
                { value: 1, label: 'Year 1' },
                { value: 2, label: 'Year 2' },
                { value: 3, label: 'Year 3' },
                { value: 4, label: 'Year 4' }
            ]
        },
        {
            name: 'semester',
            label: 'Semester',
            type: 'select',
            options: [1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: s, label: `Semester ${s}` }))
        },
        {
            name: 'facultyName',
            label: 'Assigned Faculty',
            type: 'select',
            options: [
                { value: '', label: 'Unassigned' },
                ...facultyList.map(f => ({ value: f.name, label: f.name }))
            ]
        },
        {
            name: 'type',
            label: 'Type',
            type: 'select',
            options: [
                { value: 'Theory', label: 'Theory' },
                { value: 'Lab', label: 'Lab' }
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Manage Subjects</h2>
                <button
                    onClick={async () => {
                        if (window.confirm("Update ALL Theory subjects to 6 Hours/Week (Daily Classes)? This will overwrite current hours.")) {
                            try {
                                const res = await api.post('/generator/setup/force-daily-workload');
                                alert(res.data.message);
                                window.location.reload();
                            } catch (e) {
                                alert("Failed: " + e.message);
                            }
                        }
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-purple-700 transition"
                >
                    🔧 Set Daily Workload (6 Days)
                </button>
            </div>

            <UniversalEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={editingItem}
                onSave={handleSaveEdit}
                title="Edit Subject"
                fields={subjectFields}
            />

            {/* Add Subject Form */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Subject</h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                        <input
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newSubject.name}
                            onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                            required
                            placeholder="e.g. Data Structures"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                        <input
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newSubject.code}
                            onChange={e => setNewSubject({ ...newSubject, code: e.target.value })}
                            required
                            placeholder="e.g. CS301"
                        />
                    </div>
                    {/* Department selection hidden as it's locked to currentDept */}
                    <input type="hidden" value={newSubject.departmentId} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newSubject.year}
                            onChange={e => {
                                const y = parseInt(e.target.value);
                                setNewSubject({ ...newSubject, year: y, semester: (y * 2) - 1 });
                            }}
                            required
                        >
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newSubject.semester}
                            onChange={e => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}
                            required
                        >
                            <option value={newSubject.year * 2 - 1}>Semester {newSubject.year * 2 - 1}</option>
                            <option value={newSubject.year * 2}>Semester {newSubject.year * 2}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                        <input
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newSubject.facultyName}
                            onChange={e => setNewSubject({ ...newSubject, facultyName: e.target.value })}
                            required
                            placeholder="e.g. Prof. Smith"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newSubject.type}
                            onChange={e => setNewSubject({ ...newSubject, type: e.target.value })}
                        >
                            <option value="Theory">Theory</option>
                            <option value="Lab">Lab</option>
                        </select>
                    </div>
                    <div className="md:col-span-3 lg:col-span-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
                            Add Subject
                        </button>
                    </div>
                </form>
            </div >

            {/* Subjects List */}
            < div className="bg-white rounded-lg shadow-md overflow-hidden" >
                <div className="p-4 border-b bg-gray-50 border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Subjects List</h3>
                    <span className="text-sm text-gray-500">Total: {subjects.length}</span>
                </div>

                {!currentDept && loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading subjects...</p>
                    </div>
                ) : !currentDept ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl">
                        <p className="text-lg font-bold mb-2 text-gray-400">Department data not available</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading subjects for {currentDept.name}...</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl">
                        <p className="text-lg font-bold mb-2 text-gray-400">No subjects found</p>
                        <p className="text-sm italic">There are no subjects assigned to {currentDept.name} yet.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-black leading-normal">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Code</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Year/Sem</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {subjects.map((sub, index) => (
                                <tr key={sub.id || index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium">{sub.name}</td>
                                    <td className="p-4 font-mono text-xs">{sub.code}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-[10px] font-bold">
                                            {deptList.find(d => d.id === sub.departmentId)?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-bold">Y{sub.year} / S{sub.semester}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black ${sub.type === 'Lab' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {sub.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-3">
                                        <button
                                            onClick={() => handleEdit(sub)}
                                            className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Delete this subject?')) {
                                                    const originalSubjects = [...subjects];
                                                    // Optimistic Delete
                                                    setSubjects(prev => prev.filter(item => item.id !== sub.id));

                                                    try {
                                                        await api.delete(`/subjects/${sub.id}`);
                                                    } catch (err) {
                                                        console.error(err);
                                                        setSubjects(originalSubjects); // Rollback
                                                        alert('Failed to delete subject');
                                                    }
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
                }
            </div >
        </div >
    );
}

