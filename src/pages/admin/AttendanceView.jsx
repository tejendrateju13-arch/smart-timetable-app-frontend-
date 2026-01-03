import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDepartment } from '../../context/DepartmentContext';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceView() {
    const { currentDept } = useDepartment();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [freeFaculty, setFreeFaculty] = useState([]);
    const [finderSlot, setFinderSlot] = useState('P1');

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, 10000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    // Simplified: Substitute search uses currentDept.id

    const { currentUser } = useAuth(); // Import useAuth to get user details

    // HOD Compatibility: Use currentDept (Admin context) OR currentUser.departmentId
    const activeDeptId = currentDept?.id || currentUser?.departmentId;
    const activeDeptName = currentDept?.name || currentUser?.departmentName || 'My Department';

    const fetchAttendance = async () => {
        if (!activeDeptId) return;
        try {
            const res = await api.get('/attendance/today', {
                params: {
                    date: selectedDate,
                    departmentId: activeDeptId
                }
            });
            setAttendance(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching attendance", error);
            setLoading(false);
        }
    };

    const findFreeFaculty = async () => {
        try {
            const res = await api.get('/attendance/free-faculty', {
                params: { date: selectedDate, slotId: finderSlot, departmentId: currentDept?.id }
            });
            setFreeFaculty(res.data);
        } catch (err) {
            alert("Error finding free faculty");
        }
    };

    if (loading) return <div>Loading attendance...</div>;

    const todayDisplay = new Date(selectedDate).toLocaleDateString();

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    {activeDeptName}
                </h1>
            </div>
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Faculty Attendance</h2>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                    <span className="text-xs font-bold text-gray-400 uppercase">View Date:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="text-sm font-bold outline-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance List */}
                <div className="lg:col-span-2 bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-700">Status for {todayDisplay}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                            <span className="text-green-600">Present</span>
                            <span className="text-red-500">Absent</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="bg-gray-50 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-4 border-b">Faculty</th>
                                    <th className="px-6 py-4 border-b">Status</th>
                                    <th className="px-6 py-4 border-b text-right">Activity Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendance.length > 0 ? attendance.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{entry.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${entry.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400 text-right">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="p-10 text-center text-gray-400 text-sm">No records found for this date.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Free Faculty Finder */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 h-fit sticky top-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Substitute Finder</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Department</label>
                            <div className="w-full border-2 border-gray-50 rounded-xl p-3 text-sm bg-gray-100 text-gray-500 font-bold">
                                {activeDeptName || 'Loading...'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select Period</label>
                            <select
                                value={finderSlot}
                                onChange={e => setFinderSlot(e.target.value)}
                                className="w-full border-2 border-gray-50 rounded-xl p-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold"
                            >
                                {['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].map(s => <option key={s} value={s}>Period {s}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={findFreeFaculty}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                        >
                            Find Available Faculty
                        </button>

                        <div className="mt-6 space-y-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Results</h4>
                            {freeFaculty.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {freeFaculty.map(f => (
                                        <div key={f.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between group hover:bg-white transition-all">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{f.name}</p>
                                                <p className="text-[10px] text-blue-600 font-bold uppercase">{f.designation || 'Faculty'}</p>
                                            </div>
                                            <span className="opacity-0 group-hover:opacity-100 text-blue-600 text-xs font-bold">Available</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic py-4 text-center">No search results yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
