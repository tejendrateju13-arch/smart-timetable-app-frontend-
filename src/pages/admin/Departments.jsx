import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UniversalEditModal from '../../components/admin/UniversalEditModal';

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDept, setNewDept] = useState({ name: '', programType: 'UG' });
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Error fetching departments', err);
            setError('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/departments', newDept);
            setNewDept({ name: '', programType: 'UG' });
            fetchDepartments(); // Refresh list
        } catch (err) {
            console.error(err);
            alert('Failed to add department');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (updatedData) => {
        await api.put(`/departments/${updatedData.id}`, updatedData);
        fetchDepartments();
    };

    const deptFields = [
        { name: 'name', label: 'Department Name', type: 'text' },
        {
            name: 'programType',
            label: 'Program Type',
            type: 'select',
            options: ['UG', 'PG']
        }
    ];

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Departments</h2>

            <UniversalEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={editingItem}
                onSave={handleSaveEdit}
                title="Edit Department"
                fields={deptFields}
            />

            {/* Add Department Form */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Department</h3>
                <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                        <input
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newDept.name}
                            onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                            placeholder="e.g. Computer Science"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                        <select
                            className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newDept.programType}
                            onChange={e => setNewDept({ ...newDept, programType: e.target.value })}
                        >
                            <option value="UG">UG</option>
                            <option value="PG">PG</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                        Add Department
                    </button>
                </form>
            </div>

            {/* Departments List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50 border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Existing Departments</h3>
                    <span className="text-sm text-gray-500">Total: {departments.length}</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading departments...</div>
                ) : departments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No departments found. Add one above.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Program</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {departments
                                .filter(d =>
                                    d.name.toLowerCase().includes('artificial') ||
                                    d.name.toLowerCase().includes('data science') ||
                                    d.name.toLowerCase().includes('ai&ds')
                                )
                                .map((dept, index) => (
                                    <tr key={dept.id || index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium flex items-center gap-2">
                                            {dept.name}
                                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                                                AI & DS BRANCH
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${dept.programType === 'PG' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                {dept.programType}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(dept)}
                                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Delete this department?')) {
                                                        await api.delete(`/departments/${dept.id}`);
                                                        fetchDepartments();
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
