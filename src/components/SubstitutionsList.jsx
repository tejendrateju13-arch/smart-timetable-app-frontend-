import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function SubstitutionsList() {
    const [substitutions, setSubstitutions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubstitutions();
    }, []);

    const fetchSubstitutions = async () => {
        try {
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const dateStr = (new Date(today - offset)).toISOString().slice(0, 10);

            // Link to the endpoint
            const res = await api.get(`/attendance/rearrangements?date=${dateStr}`);
            setSubstitutions(res.data);
        } catch (err) {
            console.error("Failed to fetch rearrangements", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-sm text-gray-500 mt-4">Loading substitutions...</div>;

    // If empty
    if (!substitutions || substitutions.length === 0) {
        return (
            <div className="mt-4 p-4 border border-gray-100 rounded-lg bg-gray-50 text-gray-500 text-sm italic text-center">
                No emergency substitutions for today ({new Date().toLocaleDateString()}).
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 blink"></span>
                Today's Substitutions
            </h3>
            <div className="bg-white border border-red-100 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full text-xs">
                    <thead className="bg-red-50/50 text-red-900 border-b border-red-100">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Period</th>
                            <th className="px-4 py-3 text-left font-semibold">Original Faculty</th>
                            <th className="px-4 py-3 text-left font-semibold">Substitute</th>
                            <th className="px-4 py-3 text-left font-semibold">Subject</th>
                            <th className="px-4 py-3 text-left font-semibold">Class</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50">
                        {substitutions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-red-50/30 transition-colors">
                                <td className="px-4 py-3 font-bold text-red-600">Period {sub.period || sub.slotId}</td>
                                <td className="px-4 py-3 text-gray-600">{sub.urgentFacultyName || sub.originalFacultyName}</td>
                                <td className="px-4 py-3 font-bold text-green-700">
                                    {sub.substituteFacultyName || sub.substituteName || 'Unassigned'}
                                </td>
                                <td className="px-4 py-3 text-gray-700 font-medium">{sub.subjectName}</td>
                                <td className="px-4 py-3 text-gray-500">{sub.year} / {sub.section}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sub.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {sub.status || 'Pending'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
