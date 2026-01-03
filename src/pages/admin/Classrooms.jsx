import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UniversalEditModal from '../../components/admin/UniversalEditModal';

export default function Classrooms() {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', capacity: 60, roomType: 'Lecture' });
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get('/classrooms');
            setClassrooms(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load classrooms');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/classrooms', newRoom);
            setClassrooms(prev => [...prev, res.data]);
            setNewRoom({ roomNumber: '', capacity: 60, roomType: 'Lecture' });
        } catch (err) {
            console.error(err);
            alert('Failed to add classroom');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (updatedData) => {
        const original = [...classrooms];
        setClassrooms(prev => prev.map(c => c.id === updatedData.id ? { ...c, ...updatedData } : c));
        setIsModalOpen(false);

        try {
            await api.put(`/classrooms/${updatedData.id}`, updatedData);
            // Refresh in background
            const res = await api.get('/classrooms');
            setClassrooms(res.data);
        } catch (err) {
            console.error(err);
            setClassrooms(original);
            alert('Failed to update classroom');
        }
    };

    const roomFields = [
        { name: 'roomNumber', label: 'Room Number', type: 'text' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
        {
            name: 'roomType',
            label: 'Room Type',
            type: 'select',
            options: ['Lecture', 'Lab', 'Seminar']
        }
    ];

    return (
        <div className="p-6">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    ARTIFICIAL INTELLIGENCE AND DATA SCIENCE (AI&DS)
                </h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Classrooms</h2>

            <UniversalEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={editingItem}
                onSave={handleSaveEdit}
                title="Edit Classroom"
                fields={roomFields}
            />

            {/* Add Classroom Form ... same as before ... */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Classroom</h3>
                <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                        <input
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newRoom.roomNumber}
                            onChange={e => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                            required
                            placeholder="e.g. 101-A"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newRoom.capacity}
                            onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })}
                            required
                        />
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newRoom.roomType}
                            onChange={e => setNewRoom({ ...newRoom, roomType: e.target.value })}
                        >
                            <option value="Lecture">Lecture Hall</option>
                            <option value="Lab">Laboratory</option>
                            <option value="Seminar">Seminar Hall</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                        Add Classroom
                    </button>
                </form>
            </div>

            {/* Classrooms List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50 border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Classrooms List</h3>
                    <span className="text-sm text-gray-500">Total: {classrooms.length}</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading classrooms...</div>
                ) : classrooms.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No classrooms found. Add one above.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <tr>
                                <th className="p-4 font-semibold">Room No</th>
                                <th className="p-4 font-semibold">Capacity</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {classrooms.map((room, index) => (
                                <tr key={room.id || index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium">{room.roomNumber}</td>
                                    <td className="p-4">{room.capacity} students</td>
                                    <td className="p-4">
                                        <span className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-xs">
                                            {room.roomType}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-3">
                                        <button
                                            onClick={() => handleEdit(room)}
                                            className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Delete this classroom?')) {
                                                    const original = [...classrooms];
                                                    setClassrooms(prev => prev.filter(c => c.id !== room.id));

                                                    try {
                                                        await api.delete(`/classrooms/${room.id}`);
                                                    } catch (err) {
                                                        console.error(err);
                                                        setClassrooms(original);
                                                        alert('Failed to delete classroom');
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

