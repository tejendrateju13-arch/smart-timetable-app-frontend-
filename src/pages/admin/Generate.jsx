import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import TimetablePrintView from '../../components/TimetablePrintView';
import { useDepartment } from '../../context/DepartmentContext';

export default function Generate() {
    const { currentDept } = useDepartment();

    // State
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [publishing, setPublishing] = useState(false);
    const [message, setMessage] = useState('');

    // Form Selection
    const [year, setYear] = useState('1');
    const [semester, setSemester] = useState('1');
    const [section, setSection] = useState('A');

    // New Metadata State
    const [regulation, setRegulation] = useState('R23');
    const [roomNumber, setRoomNumber] = useState('');
    const [classIncharge, setClassIncharge] = useState('');

    // Auto-update semester when year changes to stay within valid range
    useEffect(() => {
        const minSem = parseInt(year) * 2 - 1;
        const maxSem = parseInt(year) * 2;
        const currentSem = parseInt(semester);
        if (currentSem < minSem || currentSem > maxSem) {
            setSemester(minSem.toString());
        }
    }, [year, semester]);

    // Data Lists
    const [facultyList, setFacultyList] = useState([]);
    const [availableIds, setAvailableIds] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

    // 1. Fetch Data when Dept/Year/Sem changes
    useEffect(() => {
        if (currentDept) {
            fetchInitialData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDept, year, semester]);

    // 2. Auto-select Faculty when Subjects Change
    useEffect(() => {
        if (subjects.length > 0 && facultyList.length > 0) {
            // Get selected subject objects
            const selectedSubjects = subjects.filter(s => selectedSubjectIds.includes(s.id));

            // Get unique faculty names from selected subjects
            const relevantFacultyNames = [...new Set(selectedSubjects.map(s => s.facultyName))];

            // Find IDs of these faculty
            const relevantFacultyIds = facultyList
                .filter(f => relevantFacultyNames.includes(f.name))
                .map(f => f.id);

            // Update availableIds (avoiding loop if possible, but React batches updates)
            // We only set if the length or content is substantially different to avoid jitter, 
            // but simple set is fine for this scale.
            setAvailableIds(relevantFacultyIds);
        }
    }, [selectedSubjectIds, subjects, facultyList]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setMessage('');
            // Fetch Subjects
            const subRes = await api.get(`/subjects?departmentId=${currentDept.id}&year=${year}&semester=${semester}`);
            const fetchedSubjects = subRes.data || [];
            setSubjects(fetchedSubjects);
            setSelectedSubjectIds(fetchedSubjects.map(s => s.id)); // Default: Select All

            // Fetch Faculty
            const facRes = await api.get(`/faculty?departmentId=${currentDept.id}&year=${year}`);
            setFacultyList(facRes.data || []);

            // Initial Auto-Select will be handled by the useEffect above once states update
        } catch (err) {
            console.error("Error fetching data", err);
            setMessage("Error fetching data. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!currentDept) return alert('Please select a department first');

        setLoading(true);
        setMessage('');
        setCandidates([]);
        try {
            const res = await api.post('/generator/generate', {
                departmentId: currentDept.id,
                year: parseInt(year),
                semester: parseInt(semester),
                section,
                availableFacultyIds: availableIds
            });

            const results = res.data.candidates || [];
            if (results.length === 0) {
                setMessage("No candidates generated. Try adjusting constraints.");
            } else {
                setCandidates(results);
                setSelectedTab(0);
            }
        } catch (err) {
            console.error("Generator Error", err);
            const errMsg = err.response?.data?.message || err.message || 'Generation failed. Ensure backend is running and data is seeded.';
            setMessage(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (candidates.length === 0) return;
        setPublishing(true);
        try {
            const candidateToPublish = candidates[selectedTab];
            // Sending FILTERED subjects to backend for persistence
            const subjectsToSave = subjects.filter(s => selectedSubjectIds.includes(s.id));

            await api.post('/generator/publish', {
                candidateId: candidateToPublish.id,
                schedule: candidateToPublish.schedule,
                score: candidateToPublish.score,
                section,
                year: parseInt(year),
                semester: parseInt(semester),
                departmentId: currentDept.id,
                subjects: subjectsToSave,
                // NEW METADATA
                regulation,
                roomNumber,
                classIncharge,
                wef: new Date().toLocaleDateString('en-GB') // Default WEF to Today DD/MM/YYYY
            });
            setMessage('Timetable published successfully!');
        } catch (err) {
            console.error(err);
            setMessage('Failed to publish timetable.');
        } finally {
            setPublishing(false);
        }
    };

    // Construct MetaData safely
    const getMetaData = (candidate) => {
        if (!candidate) return {};
        const yearOrdinal = year === '1' ? '1st' : year === '2' ? '2nd' : year === '3' ? '3rd' : year + 'th';
        const semOrdinal = semester % 2 === 0 ? 'Even' : 'Odd';
        const actualSemOrdinal = semester === '1' ? '1st' : semester === '2' ? '2nd' : semester === '3' ? '3rd' : semester + 'th';

        return {
            roomNo: roomNumber,
            regulation: regulation,
            classIncharge: classIncharge,
            wef: new Date().toLocaleDateString('en-GB'),
            section,
            year: `${yearOrdinal} Year`,
            semester: `${actualSemOrdinal} Semester`,
            subjects: subjects.filter(s => selectedSubjectIds.includes(s.id))
        };
    };

    // Safe access for selected candidate
    const selectedCandidate = candidates[selectedTab];

    return (
        <div className="p-6">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    ARTIFICIAL INTELLIGENCE AND DATA SCIENCE (AI&DS)
                </h1>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                AI Timetable Generator - {currentDept?.name || 'Artificial Intelligence and Data Science (AI&DS)'}
            </h2>

            {/* CONTROLS CARD */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-t-4 border-purple-500">
                {/* 1. ACADEMIC DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {[1, 2].map(s => {
                                const actualSem = (parseInt(year) - 1) * 2 + s;
                                return <option key={actualSem} value={actualSem}>Sem {actualSem}</option>
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Target Section</label>
                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {['A', 'B', 'C'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* METADATA INPUTS */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Regulation (e.g., R23)</label>
                        <input
                            type="text"
                            value={regulation}
                            onChange={(e) => setRegulation(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="R23"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Room Number (Classroom)</label>
                        <input
                            type="text"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="e.g. 204"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Class In-charge</label>
                    <input
                        type="text"
                        value={classIncharge}
                        onChange={(e) => setClassIncharge(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="e.g. Dr. A. Smith"
                    />
                </div>

                <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 2. SUBJECT SELECTION */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Subjects (Year {year} / Sem {semester})
                        </label>
                        <div className="max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                            {subjects.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {subjects.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between p-2 rounded hover:bg-white border border-transparent hover:border-blue-100 transition-colors">
                                            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubjectIds.includes(sub.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedSubjectIds(prev => [...prev, sub.id]);
                                                        else setSelectedSubjectIds(prev => prev.filter(id => id !== sub.id));
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800">{sub.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{sub.code} • {sub.type}</span>
                                                </div>
                                            </label>

                                            {/* Lab 2nd Faculty Selector */}
                                            {sub.type === 'Lab' && (
                                                <div className="ml-2 w-40">
                                                    <select
                                                        value={sub.facultyName2 || ''}
                                                        onClick={(e) => e.stopPropagation()} // Prevent checkbox toggle
                                                        onChange={async (e) => {
                                                            const newName = e.target.value;
                                                            // Optimistic Update
                                                            setSubjects(prev => prev.map(s => s.id === sub.id ? { ...s, facultyName2: newName } : s));
                                                            try {
                                                                await api.put(`/subjects/${sub.id}`, { ...sub, facultyName2: newName });
                                                            } catch (err) {
                                                                console.error("Failed to update Fac 2", err);
                                                                alert("Failed to save Faculty 2 selection.");
                                                            }
                                                        }}
                                                        className="w-full text-xs p-1 border border-gray-200 rounded text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="">-- Faculty 2 --</option>
                                                        {facultyList.map(f => (
                                                            <option key={f.id} value={f.name}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                                    <p className="italic text-sm mb-1">No subjects found for Year {year}, Semester {semester}.</p>
                                    <p className="text-[10px] uppercase font-bold text-gray-300">Tip: Check if subjects are assigned to the correct Semester in the Subjects page.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. FACULTY SELECTION */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Available Faculty</label>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                                Selected: {availableIds.length} / {facultyList.length}
                            </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                            {facultyList.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {facultyList.map(faculty => (
                                        <label key={faculty.id} className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-white p-2 rounded cursor-pointer transition-colors border border-transparent hover:border-purple-100 group">
                                            <input
                                                type="checkbox"
                                                checked={availableIds.includes(faculty.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setAvailableIds(prev => [...prev, faculty.id]);
                                                    else setAvailableIds(prev => prev.filter(id => id !== faculty.id));
                                                }}
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4 mt-0.5"
                                            />
                                            <span className="font-medium group-hover:text-purple-700">{faculty.name}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-sm text-center py-4">No faculty found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. ACTIONS */}
                <div className="flex flex-col sm:flex-row items-center gap-4 border-t pt-4">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`w-full sm:w-auto px-8 py-3 rounded-lg text-white font-bold transition-all shadow-md active:scale-95 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running AI Generator...
                            </span>
                        ) : 'Run AI Generator'}
                    </button>

                    {message && (
                        <span className={`text-sm font-medium animate-pulse ${message.includes('Failed') || message.includes('Error') ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {message}
                        </span>
                    )}
                </div>
            </div>

            {/* RESULTS SECTION */}
            {candidates.length > 0 && selectedCandidate && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-2xl font-bold text-gray-800">Generated Proposals</h3>
                    </div>

                    {/* Option Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {candidates.map((cand, idx) => {
                            const isSelected = selectedTab === idx;
                            return (
                                <div key={cand.id || idx}
                                    onClick={() => setSelectedTab(idx)}
                                    className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 ${isSelected
                                        ? 'border-purple-600 bg-purple-50 shadow-lg scale-[1.02]'
                                        : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow'
                                        }`}
                                >
                                    {idx === 0 && (
                                        <span className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            BEST MATCH
                                        </span>
                                    )}
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className={`font-bold ${isSelected ? 'text-purple-800' : 'text-gray-600'}`}>
                                            Option {idx + 1}
                                        </h4>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                            {year}{['st', 'nd', 'rd'][parseInt(year) - 1] || 'th'} Yr / S{semester}
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-4xl font-extrabold text-gray-900">{Math.round(cand.score)}</span>
                                        <span className="text-sm text-gray-500 mb-1">/ 100</span>
                                    </div>
                                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${cand.score}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3 font-mono">ID: {(cand.id || '').toString().substring(0, 8)}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed View */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="p-6 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Previewing Option {selectedTab + 1}</h3>
                                <p className="text-sm font-semibold text-purple-700">
                                    {year === '1' ? '1st' : year === '2' ? '2nd' : year === '3' ? '3rd' : year + 'th'} Year,
                                    Sem {semester} - Section {section}
                                </p>
                                {(selectedCandidate.conflicts?.length > 0) ? (
                                    <span className="text-red-600 text-xs font-bold flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        {selectedCandidate.conflicts.length} Conflicts Detected
                                    </span>
                                ) : (
                                    <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        No Hard Conflicts
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className={`px-6 py-2 rounded-lg font-bold text-white shadow transition-transform active:scale-95 ${publishing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {publishing ? 'Publishing...' : 'Select & Publish This Timetable'}
                            </button>
                        </div>

                        {/* Visualizer */}
                        <div className="p-4 overflow-x-auto">
                            <TimetablePrintView
                                timetableData={selectedCandidate.schedule}
                                metaData={getMetaData(selectedCandidate)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
