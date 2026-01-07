import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDepartment } from '../../context/DepartmentContext';

export default function WorkloadAnalytics() {
    const { currentDept } = useDepartment();
    const [workload, setWorkload] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentDept) fetchWorkload();
    }, [currentDept]);

    const fetchWorkload = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/workload?departmentId=${currentDept._id || currentDept.id}`);
            setWorkload(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const maxHours = 18; // Threshold for highlighting

    return (
        <div className="space-y-6">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    ARTIFICIAL INTELLIGENCE AND DATA SCIENCE (AI&DS)
                </h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Faculty Workload Analytics</h2>

            {!currentDept ? <div className="text-gray-500">Department data not available.</div> : (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    {loading ? <div className="text-center py-10">Loading workload data...</div> : (
                        <>
                            {workload.length === 0 ? <p className="text-gray-500">No workload data available. Publish timetables first.</p> : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-700 font-bold">
                                            <tr>
                                                <th className="p-3 text-left">Faculty Name</th>
                                                <th className="p-3 text-center">Theory Hours</th>
                                                <th className="p-3 text-center">Lab Hours</th>
                                                <th className="p-3 text-center">Total Hours</th>
                                                <th className="p-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {workload.map((faculty, idx) => {
                                                const isOverloaded = faculty.total > maxHours;
                                                return (
                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                        <td className="p-3 font-medium text-gray-800">{faculty.name}</td>
                                                        <td className="p-3 text-center text-gray-600">{faculty.theory}</td>
                                                        <td className="p-3 text-center text-gray-600">{faculty.lab}</td>
                                                        <td className="p-3 text-center font-bold text-gray-800">{faculty.total}</td>
                                                        <td className="p-3 text-center">
                                                            {isOverloaded ? (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Overloaded</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Balanced</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Simple Bar Chart Visualization */}
                            {workload.length > 0 && (
                                <div className="mt-8 border-t pt-8">
                                    <h3 className="text-lg font-semibold mb-4">Workload Distribution</h3>
                                    <div className="flex items-end space-x-2 h-64 overflow-x-auto pb-2">
                                        {workload.map((f, i) => {
                                            const height = Math.min((f.total / 25) * 100, 100); // Scale to max 25 hours
                                            return (
                                                <div key={i} className="flex flex-col items-center group w-16 flex-shrink-0">
                                                    <div className="relative w-full flex justify-center">
                                                        <div
                                                            className={`w-8 rounded-t transition-all duration-500 ${f.total > maxHours ? 'bg-red-500' : 'bg-blue-500'}`}
                                                            style={{ height: `${height}%` }}
                                                        ></div>
                                                        <span className="absolute -top-6 text-xs font-bold">{f.total}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 mt-2 rotate-45 origin-left truncate w-20 block">{f.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
