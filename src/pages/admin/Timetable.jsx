import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FacultyStatusWidget from '../../components/FacultyStatusWidget';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TimetablePrintView from '../../components/TimetablePrintView';
import TimetableGrid from '../../components/TimetableGrid';
import { useDepartment } from '../../context/DepartmentContext';

export default function Timetable() {
    const { currentDept } = useDepartment();
    const [timetable, setTimetable] = useState(null);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const [searchParams] = useSearchParams();

    // View Mode State: 'Class' or 'Faculty'
    // Default to 'Class' for Admin/Student, 'Faculty' (implicit) for Faculty
    // View Mode State: 'Class' or 'Faculty'
    // Default to 'Class' for Admin/Student, 'Faculty' (implicit) for Faculty
    const [viewMode, setViewMode] = useState('Class');
    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');

    // Default filters
    const [filters, setFilters] = useState({
        year: '1',
        semester: '1',
        section: 'A'
    });

    // Fetch Faculty List if Admin
    useEffect(() => {
        if (currentUser?.role === 'Admin' || currentUser?.role === 'HOD') {
            const fetchFaculty = async () => {
                try {
                    const res = await api.get(`/faculty?departmentId=${currentDept?.id}`);
                    setFacultyList(res.data || []);
                } catch (e) {
                    console.error("Failed to load faculty list", e);
                }
            };
            if (currentDept) fetchFaculty();
        }
    }, [currentDept, currentUser]);

    // Initialize filters from URL if available (for Notifications)
    useEffect(() => {
        const urlYear = searchParams.get('year');
        const urlSem = searchParams.get('semester');
        const urlSec = searchParams.get('section');

        if (urlYear && urlSem && urlSec) {
            setFilters({
                year: urlYear,
                semester: urlSem,
                section: urlSec
            });
        } else if (currentUser?.role === 'Student' && currentUser.year) {
            // AUTO-SELECT for Students
            setFilters({
                year: currentUser.year,
                semester: currentUser.semester,
                section: currentUser.section
            });
        }
    }, [searchParams, currentUser]);

    useEffect(() => {
        if (currentDept) {
            fetchTimetableData();
        }
    }, [currentDept, filters, viewMode, selectedFaculty]);

    const fetchTimetableData = async () => {
        if (!currentUser) return;
        setLoading(true);
        console.log("Fetching Timetable...", { role: currentUser.role, viewMode, filters, selectedFaculty, currentDept: currentDept?.id });
        try {
            // CASE 1: FACULTY VIEW (Self or Admin Selected)
            // Use optional chaining for safety
            if (currentUser.role === 'Faculty' || (viewMode === 'Faculty' && selectedFaculty)) {

                const name = currentUser.role === 'Faculty'
                    ? (currentUser.displayName || currentUser.name)
                    : selectedFaculty;

                if (!name) { // Admin selected nothing yet
                    setTimetable(null);
                    setLoading(false);
                    return;
                }

                const encodedName = encodeURIComponent(name);
                const res = await api.get(`/generator/faculty-consolidated?departmentId=${currentDept.id}&facultyName=${encodedName}`);

                // Construct pseudo-metadata for the print view
                const schedule = res.data.schedule;

                // Extract subjects from schedule for the footer table
                const uniqueSubjects = [];
                const seenSubjects = new Set();

                Object.values(schedule).forEach(day => {
                    Object.values(day).forEach(period => {
                        const sName = period.subjectName || period.subject;
                        if (sName && sName !== 'Free' && !seenSubjects.has(sName)) {
                            seenSubjects.add(sName);
                            uniqueSubjects.push({
                                name: sName,
                                code: period.subjectCode || '-', // If available
                                facultyName: name
                            });
                        }
                    });
                });

                const metaData = {
                    year: 'All',
                    semester: 'Mix',
                    section: 'Various',
                    classIncharge: name, // Show Faculty Name here
                    wef: new Date().toLocaleDateString(),
                    subjects: uniqueSubjects
                };

                setTimetable(schedule ? { schedule, metaData } : null);

            } else {
                // CASE 2: CLASS VIEW (Admin/Student)
                let { year, semester, section } = filters;

                // FORCE Student Metadata to ensure visibility
                if (currentUser.role === 'Student') {
                    year = currentUser.year || year;
                    semester = currentUser.semester || semester;
                    section = currentUser.section || section;
                }

                const q = `?departmentId=${currentDept.id}&year=${year}&semester=${semester}&section=${section}`;
                const res = await api.get(`/generator/published${q}`);

                // Wrap DB result to match expected structure { schedule, metaData }
                const dbData = res.data.timetable;
                if (dbData) {
                    // Fallback: If subjects are missing in metadata (Legacy Data), extract them from schedule
                    if (!dbData.metaData || !dbData.metaData.subjects || dbData.metaData.subjects.length === 0) {
                        const uniqueSubjects = [];
                        const seenSubjects = new Set();
                        if (dbData.schedule) {
                            Object.values(dbData.schedule).forEach(day => {
                                Object.values(day).forEach(period => {
                                    const sName = period.subjectName || period.subject;
                                    // Use facultyName from period if available, or 'TBD'
                                    const fName = period.facultyName || period.faculty || 'TBD';

                                    if (sName && sName !== 'Free' && !seenSubjects.has(sName)) {
                                        seenSubjects.add(sName);
                                        uniqueSubjects.push({
                                            name: sName,
                                            code: period.subjectCode || '-',
                                            facultyName: fName
                                        });
                                    }
                                });
                            });
                        }
                        // Patch the metadata
                        if (!dbData.metaData) dbData.metaData = {};
                        dbData.metaData.subjects = uniqueSubjects;
                    }

                    setTimetable({
                        schedule: dbData.schedule,
                        metaData: dbData.metaData
                    });
                } else {
                    setTimetable(null);
                }
            }
        } catch (err) {
            console.error(err);
            setTimetable(null);
        } finally {
            setLoading(false);
        }
    };

    // New Effect: Fetch Rearrangements for overlays
    const [rearrangements, setRearrangements] = useState([]);
    useEffect(() => {
        const fetchRearrangements = async () => {
            if (!currentDept?.id) return;
            try {
                // Determine user context for filtering
                // Students need specific Year/Section, Faculty see all Dept rearrangements usually (or filtered)
                // For now, fetch ALL dept rearrangements for today
                const today = new Date().toISOString().split('T')[0];
                const res = await api.get('/attendance/rearrangements', {
                    params: { date: today, departmentId: currentDept.id }
                });

                // If Student, filter locally just to be safe (or rely on API if filtered)
                let data = res.data;
                if (currentUser.role === 'Student') {
                    data = data.filter(r => r.year == currentUser.year && r.section == currentUser.section);
                }
                setRearrangements(data);
            } catch (e) {
                console.error("Failed to fetch rearrangements", e);
            }
        };
        fetchRearrangements();
        // Poll for updates every 30s
        const interval = setInterval(fetchRearrangements, 30000);
        return () => clearInterval(interval);
    }, [currentDept, currentUser]);

    // Re-render handled by useEffect, but we need to inject the prop

    if (!currentUser) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const title = currentUser?.role === 'Faculty' ? 'My Schedule' :
        currentUser?.role === 'Student' ? 'My Class Timetable' :
            'Department Timetable';

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Faculty Status Widget */}
            {currentUser?.role === 'Faculty' && <FacultyStatusWidget currentUser={currentUser} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        {title} - {currentDept?.name}
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200">v3.1 (Latest)</span>
                    </h1>

                    <p className="text-gray-500 mt-1">
                        {currentUser?.role === 'Faculty' ? 'Personalized teaching schedule' : 'Official published schedule'}
                    </p>
                </div>

                {/* Admin Controls - Hidden for Students AND Faculty (Faculty sees only their own) */}
                {currentUser?.role !== 'Student' && currentUser?.role !== 'Faculty' && (
                    <div className="flex flex-col gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-200 p-1 rounded-lg self-start">
                            <button
                                onClick={() => setViewMode('Class')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'Class' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Class View
                            </button>
                            <button
                                onClick={() => setViewMode('Faculty')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'Faculty' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Faculty View
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-end">
                            {viewMode === 'Class' ? (
                                <>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Year</label>
                                        <select
                                            value={filters.year}
                                            onChange={e => setFilters({ ...filters, year: e.target.value })}
                                            className="text-sm font-bold bg-transparent outline-none cursor-pointer border-b border-gray-200 pb-1"
                                        >
                                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-[1px] h-8 bg-gray-100 hidden md:block"></div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Semester</label>
                                        <select
                                            value={filters.semester}
                                            onChange={e => setFilters({ ...filters, semester: e.target.value })}
                                            className="text-sm font-bold bg-transparent outline-none cursor-pointer border-b border-gray-200 pb-1"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-[1px] h-8 bg-gray-100 hidden md:block"></div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Section</label>
                                        <select
                                            value={filters.section}
                                            onChange={e => setFilters({ ...filters, section: e.target.value })}
                                            className="text-sm font-bold bg-transparent outline-none cursor-pointer border-b border-gray-200 pb-1"
                                        >
                                            {['A', 'B', 'C'].map(s => <option key={s} value={s}>Section {s}</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div className="min-w-[200px]">
                                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Select Faculty</label>
                                    <select
                                        value={selectedFaculty}
                                        onChange={e => setSelectedFaculty(e.target.value)}
                                        className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer border-b border-purple-200 pb-1 text-purple-700"
                                    >
                                        <option value="">-- Choose Faculty --</option>
                                        {facultyList.map(f => (
                                            <option key={f.id} value={f.name}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>



            {!timetable ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Timetable Found</h3>
                    <p className="text-gray-500 mb-8">
                        {currentUser?.role === 'Student'
                            ? 'Your class schedule has not been published yet.'
                            : 'No schedule found for this selection.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Weekly Schedule</h3>
                            <p className="text-sm text-gray-500">Official Format</p>
                            {timetable.metaData?.isRearranged && (
                                <div className="mt-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm font-bold">
                                    ⚠ EMERGENCY REARRANGEMENT EFFECTIVE FOR TODAY
                                    <span className="block text-xs font-normal">Original Faculty Absent. Substitutes Assigned.</span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => window.print()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded inline-flex items-center gap-2 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Print
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <TimetablePrintView
                            timetableData={timetable.schedule}
                            metaData={timetable.metaData}
                            rearrangements={rearrangements} // Pass overlay data
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
