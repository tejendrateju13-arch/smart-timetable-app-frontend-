import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDepartment } from '../../context/DepartmentContext';

export default function PerformanceConfig() {
    const { currentDept, loading: deptLoading } = useDepartment();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentDept?.id) fetchConfig();
    }, [currentDept?.id]);

    const fetchConfig = async () => {
        try {
            const res = await api.get(`/config/slots?deptId=${currentDept.id}`);
            setSlots(res.data.slots || []);
        } catch (err) {
            console.error(err);
            // Provide defaults if not found
            setSlots([
                { id: 'P1', start: '09:00 AM', end: '09:50 AM' },
                { id: 'P2', start: '09:50 AM', end: '10:40 AM' },
                { id: 'SB', start: '10:40 AM', end: '10:50 AM', isBreak: true },
                { id: 'P3', start: '10:50 AM', end: '11:40 AM' },
                { id: 'P4', start: '11:40 AM', end: '12:30 PM' },
                { id: 'LB', start: '12:30 PM', end: '01:20 PM', isBreak: true },
                { id: 'P5', start: '01:20 PM', end: '02:10 PM' },
                { id: 'P6', start: '02:10 PM', end: '03:00 PM' },
                { id: 'P7', start: '03:00 PM', end: '03:50 PM' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/config/slots', { deptId: currentDept.id, slots });
            alert("Configuration saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save configuration.");
        } finally {
            setSaving(false);
        }
    };

    const updateSlot = (index, key, val) => {
        const newSlots = [...slots];
        newSlots[index][key] = val;
        setSlots(newSlots);
    };

    if (deptLoading) return <div className="p-8 text-center text-gray-500">Initializing session...</div>;

    if (!currentDept) return <div className="p-8 text-center text-gray-500">Department data not found. Please contact administrator.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    ARTIFICIAL INTELLIGENCE AND DATA SCIENCE (AI&DS)
                </h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Institution Time Slot Configuration</h2>
            <p className="mb-8 text-gray-600">Configure daily period timings for {currentDept.name}. These will be used for AI generation and display.</p>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Period / Slot ID</th>
                            <th className="p-4 font-semibold text-gray-600">Start Time</th>
                            <th className="p-4 font-semibold text-gray-600">End Time</th>
                            <th className="p-4 font-semibold text-gray-600">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {slots.map((slot, idx) => (
                            <tr key={idx} className={slot.isBreak ? 'bg-orange-50' : ''}>
                                <td className="p-4">
                                    <input
                                        className="border rounded p-1.5 w-20 bg-white"
                                        value={slot.id}
                                        onChange={(e) => updateSlot(idx, 'id', e.target.value)}
                                    />
                                </td>
                                <td className="p-4">
                                    <input
                                        className="border rounded p-1.5 outline-none"
                                        value={slot.start}
                                        onChange={(e) => updateSlot(idx, 'start', e.target.value)}
                                    />
                                </td>
                                <td className="p-4">
                                    <input
                                        className="border rounded p-1.5 outline-none"
                                        value={slot.end}
                                        onChange={(e) => updateSlot(idx, 'end', e.target.value)}
                                    />
                                </td>
                                <td className="p-4">
                                    <select
                                        className={`px-3 py-1 rounded-full text-xs font-bold outline-none cursor-pointer transition-colors ${slot.isBreak ? 'bg-orange-200 text-orange-900 border-orange-300' : 'bg-blue-100 text-blue-900 border-blue-200'}`}
                                        value={slot.isBreak ? 'Break' : 'Class'}
                                        onChange={(e) => updateSlot(idx, 'isBreak', e.target.value === 'Break')}
                                    >
                                        <option value="Class">CLASS</option>
                                        <option value="Break">BREAK</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                    <button
                        onClick={() => setSlots([...slots, { id: slots.length + 1, start: '00:00', end: '00:00' }])}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        + Add Custom Slot
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-xl shadow-blue-200"
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
