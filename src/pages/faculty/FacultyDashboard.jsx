import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { auth, db } from '../../firebase'; // Import auth and db
import AvailabilityEditor from '../../components/AvailabilityEditor';
import TimetablePrintView from '../../components/TimetablePrintView';

export default function FacultyDashboard() {
    const [attendanceToday, setAttendanceToday] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [schedule, setSchedule] = useState(null);
    const [rearrangements, setRearrangements] = useState([]);
    const [facultyProfile, setFacultyProfile] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Rearrangement State
    const [showUrgentModal, setShowUrgentModal] = useState(false);
    const [selectedSlotForUrgent, setSelectedSlotForUrgent] = useState(null);
    const [availableSubs, setAvailableSubs] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);

    // DEBUG: Verify Update
    // console.log("Faculty Dashboard v3.3 Loaded");

    // Leave Form State
    const [leaveData, setLeaveData] = useState({ startDate: '', endDate: '', reason: '' });
    const [message, setMessage] = useState('');

    const fetchNotifications = async (uid) => {
        if (!uid) return;
        try {
            const res = await api.get('/attendance/notifications/my-notifications');
            setNotifications(res.data || []);
        } catch (error) {
            console.error("Polling Error:", error);
        }
    };

    const fetchRequests = async () => {
        if (!auth.currentUser) return;
        try {
            const [inRes, myRes] = await Promise.all([
                api.get('/attendance/rearrangement/pending-requests'),
                api.get('/attendance/rearrangement/my-requests')
            ]);

            setIncomingRequests(inRes.data || []);
            setMyRequests(myRes.data || []);
            console.log("Fetched Requests:", myRes.data);
        } catch (e) { console.error("Error fetching requests:", e); }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (auth.currentUser && isMounted) {
                await fetchDashboardData();
                await fetchNotifications(auth.currentUser.uid);
                await fetchRequests();
            }
        };

        // Initial fetch
        fetchData();

        // Poll every 2 minutes instead of 10s or whatever
        const interval = setInterval(fetchData, 120000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [auth.currentUser?.uid]); // Stable dependency

    // Separate useEffect for notifications polling if needed more frequently? 
    // No, 2 mins is fine. But we can add a manual refresh button if they want.

    // fetchCandidates removed


    const fetchDashboardData = async () => {
        if (!auth.currentUser) return;
        try {
            // Fix Timezone issue: Use local date for YYYY-MM-DD
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const todayStr = (new Date(today - offset)).toISOString().slice(0, 10);

            // 1. Fetch Independent Data in Parallel
            const [profileRes, historyRes, leavesRes, notifRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/attendance/my-history').catch(e => ({ data: [] })),
                api.get('/leaves/my-leaves').catch(e => ({ data: [] })),
                api.get('/notifications').catch(e => ({ data: [] }))
            ]);

            setFacultyProfile(profileRes.data);
            setLeaves(leavesRes.data || []);
            setNotifications(notifRes.data || []);

            const marked = (historyRes.data || []).some(entry => entry.date === todayStr);
            setAttendanceToday(marked);

            // 2. Dependent Data (Req ID/Dept)
            const deptId = profileRes.data.departmentId;
            const facultyName = profileRes.data.name;

            if (deptId) {
                const [ttRes] = await Promise.all([
                    api.get('/generator/faculty-consolidated', { params: { departmentId: deptId, facultyName } }).catch(e => ({ data: { schedule: null } }))
                ]);

                setSchedule(ttRes.data?.schedule || null);
                console.log("Full Schedule Data:", ttRes.data?.schedule);
            }

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (status = 'Present') => {
        try {
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const dateStr = (new Date(today - offset)).toISOString().slice(0, 10);

            await api.post('/attendance', { status, date: dateStr });
            setAttendanceToday(true);
            setMessage(status === 'Absent' ? 'Marked Absent. Classes Rearranged.' : 'Attendance marked successfully!');
            setTimeout(() => setMessage(''), 5000);
            fetchDashboardData(); // Refresh to see rearrangements if absent
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || 'Failed'));
        }
    };

    const submitLeave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/leaves', leaveData);
            setShowLeaveForm(false);
            setMessage('Leave application submitted.');
            setLeaveData({ startDate: '', endDate: '', reason: '' });
            fetchDashboardData(); // Refresh list
        } catch (error) {
            alert('Failed to submit leave');
        }
    };

    // --- URGENT ABSENCE HANDLERS ---

    const handleUrgentClick = () => {
        setShowUrgentModal(true);
        setSelectedSlotForUrgent(null);
        setAvailableSubs([]);
    };

    const findSubstitutes = async (slotData) => {
        setSelectedSlotForUrgent(slotData);
        setLoadingSubs(true);
        try {
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const dateStr = (new Date(today - offset)).toISOString().slice(0, 10);

            const res = await api.get('/attendance/available-substitutes', {
                params: {
                    date: dateStr,
                    slotId: slotData.slotId,
                    departmentId: facultyProfile.departmentId
                }
            });
            setAvailableSubs(res.data || []);
        } catch (e) {
            console.error(e);
            alert("Error finding substitutes");
        } finally {
            setLoadingSubs(false);
        }
    };

    const confirmSubstitution = async (substituteId) => {
        if (!confirm("Are you sure you want to assign this Faculty?")) return;

        console.log("Confirming Substitution with Slot Data:", selectedSlotForUrgent);
        if (!selectedSlotForUrgent.subjectName) {
            console.warn("Subject Name is missing in slot data!");
        }

        try {
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const dateStr = (new Date(today - offset)).toISOString().slice(0, 10);

            // Ensure we are sending the strings, fallback to defaults if strictly necessary
            const payload = {
                slotId: selectedSlotForUrgent.slotId,
                date: dateStr,
                substituteId: substituteId,
                subjectName: selectedSlotForUrgent.subjectName || 'Subject Unspecified',
                className: selectedSlotForUrgent.className || selectedSlotForUrgent.classLabel || 'Class Unspecified'
            };
            console.log("Sending Payload:", payload);

            await api.post('/attendance/period-absence', payload);

            setMessage(`Success! Request sent to substitute.`);
            setShowUrgentModal(false);
            fetchDashboardData();
            fetchRequests(); // Refresh requests list immediately

        } catch (e) {
            alert(e.response?.data?.message || "Error assigning substitute");
        }
    };

    // Helper to get today's classes from schedule
    const getTodayClasses = () => {
        if (!schedule) return [];

        // Robust Local YYYY-MM-DD
        const now = new Date();
        const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[now.getDay()];
        const daySchedule = schedule[todayName] || {};

        // Convert object to array: { P1: {...}, P2: {...} }
        return Object.entries(daySchedule).map(([key, val]) => {
            // Check if already rearranged for TODAY
            const existing = myRequests.find(req => req.slotId === key && req.date === dateStr && req.status !== 'rejected');

            // Console Debug for logic verification
            // if (key === 'P4') {
            //    console.log("[DEBUG P4] Date Match:", dateStr, "Requests:", myRequests);
            // }

            return {
                slotId: key,
                ...val,
                isRearranged: !!existing || val.isSubstitution === true,
                rearrangementStatus: existing?.status || (val.isSubstitution ? 'accepted' : null)
            };
        }).sort((a, b) => a.slotId.localeCompare(b.slotId));
    };

    // NEW: Handle Response (Accept/Reject)
    const handleResponse = async (rearrangementId, status) => {
        try {
            console.log(`Responding to request ${rearrangementId} with ${status}`);
            const myUid = facultyProfile.uid || facultyProfile.id;

            await api.post('/attendance/rearrangement/respond', {
                requestId: rearrangementId, // Fixed key match
                status,
                uid: myUid
            });

            // Optimistic UI Update: Update status instead of removing
            setIncomingRequests(prev => prev.map(req =>
                req.id === rearrangementId ? { ...req, status } : req
            ));

            // Refresh to ensure sync (optional, maybe just wait for next poll)
            // setTimeout(() => {
            //    fetchRequests();
            //    fetchDashboardData();
            // }, 1000);

        } catch (error) {
            console.error("Error responding:", error);
            alert("Failed to update status. " + (error.response?.data?.message || ''));
            // Revert changes if needed (scoping issue, simpler to just re-fetch)
            fetchRequests();
        }
    };

    // Skeleton Loading Component
    if (loading) return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                Faculty Dashboard
                <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200 shadow-sm">v3.3 (Manual Select)</span>
            </h2>
            {message && <div className={`p-3 rounded ${message.includes('Rearranged') ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{message}</div>}

            {/* Modals Removed */}

            {/* Notifications Panel - NEW */}
            <div className={`fixed right-0 top-20 bottom-0 w-80 bg-white shadow-2xl border-l transform transition-transform duration-300 z-40 ${showNotifications ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-black">&times;</button>
                </div>
                <div className="p-4 overflow-y-auto h-full pb-20">
                    {notifications.length === 0 ? <p className="text-gray-400 text-sm text-center mt-10">No new notifications</p> : (
                        <ul className="space-y-3">
                            {notifications.map(notif => (
                                <li key={notif.id} className={`p-3 rounded border text-sm ${notif.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
                                    <p className="font-bold text-gray-800 mb-1">{notif.title || 'Alert'}</p>
                                    <p className="text-gray-600">{notif.message}</p>
                                    <span className="text-xs text-gray-400 mt-2 block">
                                        {(() => {
                                            const d = notif.timestamp || notif.createdAt;
                                            const dateObj = d?.toDate ? d.toDate() : new Date(d);
                                            return isNaN(dateObj) ? 'Just now' : dateObj.toLocaleString();
                                        })()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Toggle Button for Notifications */}
            <button onClick={() => setShowNotifications(!showNotifications)} className="fixed right-6 bottom-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50 flex items-center gap-2">
                <span>🔔</span>
                {notifications.filter(n => !n.read).length > 0 &&
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full absolute -top-1 -right-1">
                        {notifications.filter(n => !n.read).length}
                    </span>
                }
            </button>





            {/* Urgent Absence & Requests Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Urgent Absence Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-xl font-semibold text-red-700 mb-2">Urgent Absence</h3>
                    <p className="text-sm text-gray-600 mb-4">Need a substitute? Request one here.</p>
                    <button
                        onClick={handleUrgentClick}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                        🚨 Request Rearrangement
                    </button>

                    {/* My Requests Preview */}
                    <div className="mt-4 border-t pt-4">
                        {/* 1. Accepted Requests Prominently */}
                        {myRequests.filter(r => r.status === 'accepted').length > 0 && (
                            <div className="mb-4 space-y-2">
                                <h4 className="font-bold text-green-700 text-sm">✅ Covered Classes</h4>
                                {myRequests.filter(r => r.status === 'accepted').map(req => (
                                    <div key={req.id} className="p-3 bg-green-50 border border-green-200 rounded flex justify-between items-center shadow-sm">
                                        <div>
                                            <span className="block font-bold text-green-900">{req.substituteName || req.substituteFacultyName}</span>
                                            <span className="text-xs text-green-700">is covering {req.slotId} ({req.date.split('-').slice(1).join('/')})</span>
                                        </div>
                                        <span className="text-xl">🤝</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. Pending/Rejected List */}
                        {myRequests.filter(r => r.status !== 'accepted').length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-700 text-sm mb-2">Pending / Rejected</h4>
                                <ul className="space-y-2 max-h-40 overflow-y-auto">
                                    {myRequests.filter(r => r.status !== 'accepted').map(req => (
                                        <li key={req.id} className="text-xs p-2 bg-gray-50 rounded border flex justify-between items-center">
                                            <span>{req.slotId} - {req.substituteName || req.substituteFacultyName}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>{req.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Incoming Requests */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Newly Assigned Classes</h3>
                    <p className="text-sm text-gray-600 mb-4">Classes you have been requested to cover.</p>

                    {incomingRequests.length === 0 ? (
                        <p className="text-center text-gray-400 py-4 italic">No new assignments.</p>
                    ) : (
                        <ul className="space-y-3">
                            {incomingRequests.map(req => (
                                <li key={req.id} className={`p-3 border rounded ${req.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="block font-bold text-gray-800">{req.originalFacultyName || req.urgentFacultyName}</span>
                                            {/* <span className="text-sm font-semibold text-gray-700">{req.subjectName || 'Unknown Subject'}</span> */}
                                            <span className="text-xs text-gray-600 block">{req.classLabel || req.className || 'Class TBD'} | {req.periodLabel || req.slotId}</span>
                                            <span className="text-xs text-gray-500 block mt-1">{new Date(req.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold block mb-1">{req.slotId}</span>
                                            {req.status === 'accepted' && <span className="text-green-600 font-bold text-xs">✅ Accepted</span>}
                                            {req.status === 'rejected' && <span className="text-red-600 font-bold text-xs">❌ Rejected</span>}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        {req.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleResponse(req.id, 'accepted')}
                                                    className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm hover:bg-green-700 font-bold shadow-sm">
                                                    Accept Assignment
                                                </button>
                                                <button
                                                    onClick={() => handleResponse(req.id, 'rejected')}
                                                    className="flex-1 bg-red-500 text-white py-1.5 rounded text-sm hover:bg-red-600 font-bold shadow-sm">
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Remove this from your list?')) return;
                                                    try {
                                                        await api.delete(`/attendance/rearrangement/${req.id}`);
                                                        setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
                                                    } catch (e) { alert('Failed to delete'); }
                                                }}
                                                className="w-full bg-gray-200 text-gray-700 py-1.5 rounded text-sm hover:bg-gray-300 font-bold shadow-sm flex items-center justify-center gap-2">
                                                <span>🗑️ Remove from list</span>
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* MODAL: Urgent Absence Finder */}
            {showUrgentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">Select Class for Substitution</h3>
                            <button onClick={() => setShowUrgentModal(false)} className="text-gray-500 hover:text-black font-bold text-xl">&times;</button>
                        </div>

                        <div className="p-6">
                            {!selectedSlotForUrgent ? (
                                <div className="space-y-4">
                                    <p className="text-gray-600 mb-4">Select the class you cannot attend:</p>
                                    <div className="grid gap-3">
                                        {getTodayClasses().map((cls, idx) => (
                                            <div key={idx} className={`border p-4 rounded flex justify-between items-center transition ${cls.isRearranged ? 'bg-gray-50 border-gray-200' : 'hover:bg-blue-50 cursor-pointer'}`}
                                                onClick={() => !cls.isRearranged && findSubstitutes(cls)}>
                                                <div>
                                                    <span className="font-bold text-lg text-gray-800 block">{cls.slotId}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-700">{cls.subjectName || 'Unknown Subject'}</span>
                                                        <span className="text-xs text-gray-500">{cls.className || cls.classLabel || 'Class TBD'}</span>
                                                    </div>
                                                </div>

                                                {/* Badge Logic */}
                                                {cls.isRearranged ? (
                                                    <div className="text-right">
                                                        {cls.rearrangementStatus === 'pending' && (
                                                            <span className="text-orange-600 font-bold text-sm bg-orange-100 px-3 py-1 rounded inline-flex items-center gap-1">
                                                                ⏳ Waiting for Response
                                                            </span>
                                                        )}
                                                        {cls.rearrangementStatus === 'accepted' && (
                                                            <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded inline-flex items-center gap-1">
                                                                ✅ Covered
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-xs font-semibold">
                                                        Find Subs
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {getTodayClasses().length === 0 && <p className="text-center text-gray-500 italic">No classes scheduled for today.</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button onClick={() => { setSelectedSlotForUrgent(null); setAvailableSubs([]); }} className="text-sm text-blue-600 hover:underline mb-2">&larr; Back to Classes</button>

                                    <div className="bg-gray-50 p-4 rounded border mb-4">
                                        <h4 className="font-bold text-gray-800">Finding Substitute for: {selectedSlotForUrgent.slotId}</h4>
                                        <div className="mt-2">
                                            <label className="text-xs text-gray-500 block mb-1">Subject Name (Verify & Edit)</label>
                                            <input
                                                type="text"
                                                value={selectedSlotForUrgent.subjectName}
                                                onChange={(e) => setSelectedSlotForUrgent({ ...selectedSlotForUrgent, subjectName: e.target.value })}
                                                className="w-full border p-2 rounded text-sm font-semibold text-gray-700 bg-white"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">Class: {selectedSlotForUrgent.year}-{selectedSlotForUrgent.section}</p>
                                    </div>

                                    {loadingSubs ? (
                                        <div className="text-center py-8 text-gray-500">Scanning for available faculty...</div>
                                    ) : (
                                        <div>
                                            <h5 className="font-semibold text-gray-700 mb-3">Available Faculty ({availableSubs.length})</h5>
                                            {availableSubs.length === 0 ? (
                                                <div className="text-center p-4 bg-yellow-50 text-yellow-800 rounded">
                                                    No free faculty found in your department for this slot.
                                                </div>
                                            ) : (
                                                <div className="grid gap-2 max-h-60 overflow-y-auto">
                                                    {availableSubs.map(sub => (
                                                        <div key={sub.id} className="flex justify-between items-center p-3 border rounded hover:bg-green-50 cursor-pointer transition">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                    {sub.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm">{sub.name}</p>
                                                                    <p className="text-[10px] text-gray-500">{sub.email}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); confirmSubstitution(sub.id); }}
                                                                className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 shadow-sm font-bold">
                                                                Request
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Attendance Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-xl font-semibold mb-4">
                        Daily Attendance <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full ml-2 align-middle">v3.4 (Stable)</span>
                    </h3>
                    {attendanceToday ? (
                        <div className="text-center py-4">
                            <span className="text-4xl">✅</span>
                            <p className="text-green-600 font-bold mt-2">Marked for Today</p>
                            <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="mb-4 text-gray-600">Please mark your attendance.</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => markAttendance('Present')}
                                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition shadow-lg"
                                >
                                    Mark Present
                                </button>
                                <button
                                    onClick={() => markAttendance('Absent')}
                                    className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition shadow-lg"
                                >
                                    Mark Absent (Full Day)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Leave Management Card */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Leave Management</h3>
                    <button
                        onClick={() => setShowLeaveForm(!showLeaveForm)}
                        className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200"
                    >
                        {showLeaveForm ? 'Cancel' : '+ Apply Leave'}
                    </button>
                </div>

                {showLeaveForm ? (
                    <form onSubmit={submitLeave} className="space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-500">Start Date</label>
                                <input type="date" required className="w-full border p-1 rounded"
                                    value={leaveData.startDate} onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">End Date</label>
                                <input type="date" required className="w-full border p-1 rounded"
                                    value={leaveData.endDate} onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })} />
                            </div>
                        </div>
                        <textarea placeholder="Reason for leave..." required className="w-full border p-2 rounded text-sm"
                            value={leaveData.reason} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}></textarea>
                        <button type="submit" className="w-full bg-orange-500 text-white py-1.5 rounded hover:bg-orange-600 font-bold">Submit Application</button>
                    </form>
                ) : (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-500">Recent Applications</h4>
                        {leaves.length === 0 ? <p className="text-sm text-gray-400">No leave history.</p> : (
                            <ul className="max-h-40 overflow-y-auto space-y-2">
                                {leaves.map(leave => (
                                    <li key={leave.id || Math.random()} className="text-sm border-b pb-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{leave.startDate} <span className="text-gray-400">to</span> {leave.endDate}</span>
                                            <span className={`px-2 rounded-full text-[10px] font-bold ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                leave.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>{leave.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{leave.reason}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>


            {/* My Timetable Section */}
            {
                schedule && (
                    <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">My Weekly Schedule</h3>
                        </div>

                        {/* Use the standard Print View for consistent formatting */}
                        <div className="overflow-x-auto">
                            <TimetablePrintView
                                timetableData={schedule}
                                rearrangements={[
                                    ...myRequests.filter(r => r.status === 'accepted').map(r => ({ ...r, type: 'absence' })),
                                    ...incomingRequests.filter(r => r.status === 'accepted').map(r => ({ ...r, type: 'cover' }))
                                ]}
                                metaData={{
                                    year: 'All',
                                    semester: 'Mix',
                                    section: 'Various',
                                    classIncharge: 'Self',
                                    wef: new Date().toLocaleDateString(),
                                    subjects: [] // Optional
                                }}
                            />
                        </div>
                    </div>
                )
            }

            {/* Availability Editor Section - Prominent */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500">
                <h3 className="text-xl font-bold text-gray-800 mb-2">My Availability & Preferences</h3>
                <p className="text-gray-500 mb-6 text-sm">Update your preferred slots. The AI scheduler will try to respect these when generating future timetables.</p>

                <AvailabilityEditor />
            </div>
        </div >
    );
}
