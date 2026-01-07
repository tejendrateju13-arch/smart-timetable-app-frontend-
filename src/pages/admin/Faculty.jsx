import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UniversalEditModal from '../../components/admin/UniversalEditModal';
import { useDepartment } from '../../context/DepartmentContext';

export default function Faculty() {
    const { currentDept, departments, loading: deptLoading } = useDepartment();
    const [faculty, setFaculty] = useState([]);
    const [deptList, setDeptList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newFaculty, setNewFaculty] = useState({ name: '', departmentId: currentDept?._id || '', email: '', years: [1, 2, 3, 4], sections: ['A', 'B', 'C'], maxClassesPerDay: 4 });
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentDept?._id) {
            console.log("Faculty page currentDept:", currentDept._id);
            fetchFaculty();
            // Also update newFaculty default deptId if it changes
            setNewFaculty(prev => ({ ...prev, departmentId: currentDept._id }));
        }
    }, [currentDept?._id]);

    const fetchFaculty = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [facultyRes, deptRes] = await Promise.all([
                api.get(`/faculty?departmentId=${currentDept._id}`),
                api.get('/departments')
            ]);
            setFaculty(facultyRes.data);
            setDeptList(deptRes.data);
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
            // Ensure departmentId is set from currentDept if missing in newFaculty
            const payload = { ...newFaculty, departmentId: newFaculty.departmentId || currentDept?._id };
            if (!payload.departmentId) {
                alert("Department ID missing. Please refresh or select a department.");
                return;
            }

            const res = await api.post('/faculty', payload);
            // Append locally for instant feedback
            setFaculty(prev => [...prev, res.data]);
            setNewFaculty({ name: '', departmentId: currentDept?._id || '', email: '', years: [1, 2, 3, 4], sections: ['A', 'B', 'C'], maxClassesPerDay: 4 });
        } catch (err) {
            console.error(err);
            alert('Failed to add faculty: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (updatedData) => {
        // Optimistic Update
        const originalFaculty = [...faculty];
        setFaculty(prev => prev.map(f => f._id === updatedData._id ? { ...f, ...updatedData } : f));
        setIsModalOpen(false);

        try {
            await api.put(`/faculty/${updatedData._id}`, updatedData);
            // Optional: fetch again to sync with server, but without setloading(true)
            const res = await api.get(`/faculty?departmentId=${currentDept._id}`);
            setFaculty(res.data);
        } catch (err) {
            console.error(err);
            setFaculty(originalFaculty); // Rollback
            alert('Failed to update faculty');
        }
    };

    const facultyFields = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        {
            name: 'years',
            label: 'Assigned Years',
            type: 'checkbox-group',
            options: [1, 2, 3, 4],
            required: false
        },
        {
            name: 'sections',
            label: 'Assigned Sections',
            type: 'checkbox-group',
            options: ['A', 'B', 'C'],
            required: false
        },
        {
            name: 'departmentId',
            label: 'Department',
            type: 'select',
            options: deptList.map(d => ({ value: d._id, label: d.name }))
        },
        { name: 'maxClassesPerDay', label: 'Max Classes / Day', type: 'number' },
        { name: 'weeklyWorkloadLimit', label: 'Weekly Load Limit', type: 'number' },
        { name: 'averageLeavesPerMonth', label: 'Avg Leaves/Month', type: 'number' },
        {
            name: 'labEligibility',
            label: 'Eligibility',
            type: 'select',
            options: [
                { value: 'TheoryOnly', label: 'Theory Only' },
                { value: 'LabOnly', label: 'Lab Only' },
                { value: 'Both', label: 'Theory & Lab' }
            ]
        }
    ];

    if (deptLoading) return <div className="p-8 text-center text-gray-500">Initializing department...</div>;
    if (!currentDept) return <div className="p-8 text-center text-gray-500">Department data not available.</div>;

    return (
        <div className="p-6">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    {currentDept.name} ({currentDept.code || 'DEPT'})
                </h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Faculty</h2>

            <UniversalEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={editingItem}
                onSave={handleSaveEdit}
                title="Edit Faculty Member"
                fields={facultyFields}
            />

            {/* Add Faculty Form */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Faculty</h3>
                <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="facultyName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            id="facultyName"
                            name="name"
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newFaculty.name}
                            onChange={e => setNewFaculty({ ...newFaculty, name: e.target.value })}
                            required
                            placeholder="Dr. John Doe"
                        />
                    </div>
                    <div className="min-w-[200px]">
                        <label htmlFor="facultyEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="facultyEmail"
                            name="email"
                            type="email"
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newFaculty.email}
                            onChange={e => setNewFaculty({ ...newFaculty, email: e.target.value })}
                            required
                            placeholder="john.doe@example.com"
                        />
                    </div>
                    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded border border-gray-200 min-w-[150px]">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Years</label>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4].map(y => (
                                <label key={y} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        checked={newFaculty.years?.includes(y)}
                                        onChange={(e) => {
                                            const current = newFaculty.years || [];
                                            const next = e.target.checked ? [...current, y] : current.filter(v => v !== y);
                                            setNewFaculty({ ...newFaculty, years: next });
                                        }}
                                    />
                                    <span className="text-sm font-bold text-gray-700">{y}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded border border-gray-200 min-w-[150px]">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Sections</label>
                        <div className="flex gap-3">
                            {['A', 'B', 'C'].map(s => (
                                <label key={s} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        checked={newFaculty.sections?.includes(s)}
                                        onChange={(e) => {
                                            const current = newFaculty.sections || [];
                                            const next = e.target.checked ? [...current, s] : current.filter(v => v !== s);
                                            setNewFaculty({ ...newFaculty, sections: next });
                                        }}
                                    />
                                    <span className="text-sm font-bold text-gray-700">{s}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <input type="hidden" value={newFaculty.departmentId} />
                    <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Load</label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newFaculty.maxClassesPerDay}
                            onChange={e => setNewFaculty({ ...newFaculty, maxClassesPerDay: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                        Add Faculty
                    </button>
                </form>
            </div>

            {/* Faculty List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50 border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Faculty List</h3>
                    <span className="text-sm text-gray-500">Total: {faculty.length}</span>
                </div>

                {!currentDept && loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading faculty members...</p>
                    </div>
                ) : !currentDept ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl">
                        <p className="text-lg font-bold mb-2 text-gray-400">Department data not available</p>
                    </div>
                ) : faculty.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading faculty members for {currentDept.name}...</p>
                    </div>
                ) : faculty.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl">
                        <p className="text-lg font-bold mb-2 text-gray-400">No faculty members found</p>
                        <p className="text-sm italic">There are no faculty members assigned to {currentDept.name} yet.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Year</th>
                                <th className="p-4 font-semibold">Department</th>
                                <th className="p-4 font-semibold">Workload Rules</th>
                                <th className="p-4 font-semibold">Eligibility</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {faculty.map((f, index) => (
                                <tr key={f._id || index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium">{f.name}</td>
                                    <td className="p-4 text-xs text-gray-500">{f.email}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {f.years?.map(y => (
                                                <span key={y} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Y{y}</span>
                                            ))}
                                            {f.sections?.map(s => (
                                                <span key={s} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">Sec {s}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs">
                                            {deptList.find(d => d._id === f.departmentId)?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4 p-2 text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span>Load: <span className="font-bold">{f.weeklyWorkloadLimit || 18}</span>/wk</span>
                                            <span>Max: <span className="font-bold">{f.maxClassesPerDay}</span>/day</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs">
                                        {f.labEligibility === 'Yes'
                                            ? <span className="text-green-600 font-bold">✓ Labs</span>
                                            : <span className="text-gray-400">Theory Only</span>}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-3">
                                        <button
                                            onClick={() => handleEdit(f)}
                                            className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Delete this faculty member?')) {
                                                    const originalFaculty = [...faculty];
                                                    // Optimistic delete
                                                    setFaculty(prev => prev.filter(item => item._id !== f._id));

                                                    try {
                                                        await api.delete(`/faculty/${f._id}`);
                                                    } catch (err) {
                                                        console.error(err);
                                                        setFaculty(originalFaculty); // Rollback
                                                        alert('Failed to delete faculty');
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
                )}
            </div>
        </div>
    );
}
