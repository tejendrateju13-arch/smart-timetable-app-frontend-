import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function StudentStatistics({ departmentId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (departmentId) {
            fetchStatistics();
        }
    }, [departmentId]);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/students?departmentId=${departmentId}`);
            const students = res.data;

            // Calculate statistics
            const yearStats = {};
            const sectionStats = {};
            let total = 0;

            students.forEach(student => {
                const year = student.year;
                const section = student.section;

                // Year stats
                if (!yearStats[year]) {
                    yearStats[year] = { total: 0, sections: {} };
                }
                yearStats[year].total++;

                // Section stats within year
                if (!yearStats[year].sections[section]) {
                    yearStats[year].sections[section] = 0;
                }
                yearStats[year].sections[section]++;

                // Overall section stats
                if (!sectionStats[section]) {
                    sectionStats[section] = 0;
                }
                sectionStats[section]++;

                total++;
            });

            setStats({ yearStats, sectionStats, total });
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Loading statistics...</div>;
    }

    if (!stats) {
        return <div className="text-sm text-gray-500">No statistics available</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Total Students</div>
                <div className="text-3xl font-black text-blue-600">{stats.total}</div>
            </div>

            {/* Year-wise breakdown */}
            {Object.keys(stats.yearStats).sort().map(year => (
                <div key={year} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Year {year}</div>
                    <div className="text-3xl font-black text-green-600 mb-2">{stats.yearStats[year].total}</div>
                    <div className="flex gap-2 text-xs">
                        {Object.keys(stats.yearStats[year].sections).sort().map(section => (
                            <span key={section} className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">
                                {section}: {stats.yearStats[year].sections[section]}
                            </span>
                        ))}
                    </div>
                </div>
            ))}

            {/* Section-wise overall */}
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">By Section</div>
                <div className="space-y-2 mt-2">
                    {Object.keys(stats.sectionStats).sort().map(section => (
                        <div key={section} className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Section {section}</span>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black">
                                {stats.sectionStats[section]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
