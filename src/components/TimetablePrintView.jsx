import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';

const TimetablePrintView = ({ timetableData, metaData, rearrangements = [] }) => {
    const componentRef = useRef(null);
    const { currentUser } = useAuth();
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Editable States
    const [regulation, setRegulation] = useState('R23');
    const [roomNumber, setRoomNumber] = useState('');
    const [wefDate, setWefDate] = useState('');
    const [classIncharge, setClassIncharge] = useState('');

    // Date Calculation for Current Week View
    const getDatesForWeek = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0-6 (Sun-Sat)
        // Adjust to Monday (1)
        const diffToMon = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diffToMon));

        const weekDates = {};
        const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        for (let i = 0; i < 6; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            // Format YYYY-MM-DD for comparison
            const offset = d.getTimezoneOffset() * 60000;
            const isoDate = (new Date(d - offset)).toISOString().slice(0, 10);
            weekDates[days[i]] = isoDate;
        }
        return weekDates;
    };

    const weekDates = getDatesForWeek();


    useEffect(() => {
        if (metaData) {
            setWefDate(metaData.wef || '');
            setRegulation(metaData.regulation || 'R23');
            setRoomNumber(metaData.roomNo || '');
            setClassIncharge(metaData.classIncharge || '');
        }
    }, [metaData]);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Timetable_${new Date().toISOString().slice(0, 10)}`,
        pageStyle: `
            @page {
                size: A4 landscape;
                margin: 0;
            }
            @media print {
                html, body {
                    height: auto !important;
                    min-height: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                }

                /* HIDE EVERYTHING ELSE */
                body > *:not(.print-root) {
                    display: none !important;
                }

                #root {
                    display: none !important;
                }

                /* RESET ALL SCROLL/HEIGHTS FOR PRINT CONTAINER */
                .print-container {
                    display: block !important; 
                    position: static !important;
                    width: 100% !important;
                    height: auto !important;
                    min-height: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                    
                    /* KEY FIX: ZOOM TO FIT ONE PAGE */
                    zoom: 0.55 !important;
                    
                    margin: 0 !important;
                    padding: 10mm !important; /* Small internal padding */
                    background: white !important;
                    color: black !important;
                    font-family: 'Times New Roman', Times, serif !important;
                    
                    /* No Page Breaks */
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }

                /* Override inline styles that might interfere */
                .print-container[style] {
                    min-width: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                }

                /* PREVENT BREAKS GLOBALLY */
                table, tr, td, th, tbody, thead, .header-college, .header-sub, .signature-wrapper {
                    page-break-before: avoid !important;
                    page-break-after: avoid !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }

                .no-print, button, .shadow-lg { display: none !important; }

                /* FORCE SERIF GLOBALLY */
                * { font-family: 'Times New Roman', Times, serif !important; }

                /* HEADER STYLES */
                .header-college { font-size: 16pt !important; font-weight: bold !important; text-transform: uppercase !important; }
                .header-sub { font-size: 11pt !important; font-weight: bold !important; }

                /* TABLE STYLES - Content 10.5pt - 11pt */
                table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-top: 5px !important;
                    table-layout: fixed !important; /* Strict table layout */
                }
                th, td {
                    border: 1px solid black !important;
                    padding: 4px !important; 
                    font-size: 10.5pt !important;
                    line-height: 1.1 !important;
                    font-family: 'Times New Roman', Times, serif !important;
                    word-wrap: break-word !important;
                }
                
                /* DAY Column Specific */
                th:first-child, td:first-child {
                    width: 80px !important;
                    font-weight: bold !important;
                    text-align: center !important;
                }

                /* INPUTS AS TEXT */
                input {
                    border: none !important;
                    background: transparent !important;
                    width: auto !important;
                    text-align: left !important;
                    font-family: 'Times New Roman', Times, serif !important;
                    font-size: 11pt !important;
                    font-weight: bold !important;
                }

                .signature-wrapper {
                    margin-top: 2rem !important;
                    font-size: 11pt !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-after: right !important; /* Push to end */
                }
            }
        `
    });

    const isFaculty = currentUser?.role === 'Faculty' || currentUser?.role === 'faculty';
    const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'HOD' || currentUser?.role === 'admin' || currentUser?.role === 'hod';

    // Timings Helper
    const timings = [
        "09:40 AM\n10:40 AM",
        "10:40 AM\n11:30 AM",
        "11:40 AM\n12:30 PM",
        "12:30 PM\n01:20 PM",
        "02:00 PM\n02:50 PM",
        "02:50 PM\n03:40 PM",
        "03:40 PM\n04:30 PM"
    ];

    const getCellContent = (dayShort, slotId) => {
        const dayMap = { 'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday' };
        const fullDay = dayMap[dayShort];

        // 1. Check for Active Rearrangement for THIS SPECIFIC DATE
        const dateForThisColumn = weekDates[dayShort];

        // DEBUG LOGGING
        if (rearrangements.length > 0 && dayShort === 'MON' && (slotId === 'P3' || slotId === 'P4')) {
            const matching = rearrangements.filter(r => r.slotId === slotId);
            if (matching.length > 0) {
                console.log(`[DEBUG] Checking Element ${dayShort} ${slotId}`, {
                    dateForThisColumn,
                    candidates: matching,
                    meta: metaData,
                    fullDay
                });
            }
        }

        const activeRearrangement = rearrangements.find(r =>
            r.slotId === slotId && r.date === dateForThisColumn
        );

        if (activeRearrangement) {
            if (activeRearrangement.type === 'absence') {
                // I am absent, someone else is taking it
                return {
                    text: <span className="text-red-700 italic">Leaves/Absent</span>,
                    subText: `Covered by: ${activeRearrangement.substituteName}`,
                    type: 'rearranged_out',
                };
            } else if (activeRearrangement.type === 'cover') {
                // I am covering someone else
                return {
                    text: <span className="text-green-700 font-bold">{activeRearrangement.subjectName || 'Substitution'}</span>,
                    subText: `(For ${activeRearrangement.originalFacultyName || activeRearrangement.requesterName})`,
                    room: 'Check Dept',
                    className: activeRearrangement.className || activeRearrangement.classLabel,
                    type: 'rearranged_in'
                };
            }
        }

        if (!timetableData || !timetableData[fullDay]) return { text: '---', type: 'empty' };

        const entry = timetableData[fullDay][slotId];
        if (!entry) return { text: '---', type: 'empty' };

        let display = entry.subjectName || '---';

        return {
            text: display,
            type: entry.type,
            facultyName: entry.facultyName,
            facultyName2: entry.facultyName2,
            room: entry.roomNumber,
            className: entry.year ? `${entry.year}-${entry.section}` : null
        };
    };

    const formatYearSem = (y, s) => {
        if (typeof y === 'string' && y.includes('Year')) return `${y} B.Tech ${s}`;
        const yOrd = y == 1 ? 'I' : y == 2 ? 'II' : y == 3 ? 'III' : 'IV';
        const semIsOdd = s % 2 !== 0; // Check parity
        const finalSem = s == 1 || semIsOdd ? 'I' : 'II'; // Default to I if odd, II if even/2

        return `${yOrd} B.Tech ${finalSem} Semester`;
    };

    return (
        <div className="p-4 w-full font-serif text-sm"> {/* Added text-sm base size */}
            <div className="flex justify-between items-center mb-4 no-print">
                <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">
                    Print / Save PDF (Corrected Format)
                </button>
                <div className="text-xs text-gray-500 italic">
                    Note: This view reflects the schedule for the current week ({weekDates['MON']} to {weekDates['SAT']}).
                </div>
            </div>

            {/* Main Container - Responsive Fixes */}
            {/* Removed min-w-[1100px] to allow flex shrinking on laptops */}
            <div className={`w-full bg-white ${currentUser ? 'shadow-lg border border-gray-200 rounded-lg' : ''} overflow-x-auto print:overflow-visible`}>
                <div
                    ref={componentRef}
                    className="print-container bg-white text-black relative p-4 md:p-8 mx-auto font-serif print:w-full print:min-w-0" // Reduced padding on md
                    style={{ maxWidth: '100%', minWidth: '800px' }} // Allow shrinking but keep structure
                >

                    {/* Header */}
                    <div className="text-center border-b-2 border-black pb-1 mb-1">
                        <div className="flex flex-row items-center justify-center px-2 gap-4">
                            {/* Logo */}
                            <div className="h-16 w-16 md:h-20 md:w-20 flex items-center justify-center shrink-0">
                                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                            </div>

                            <div className="text-center">
                                <h1 className="header-college mb-1 text-red-700 print:text-red-700 font-black leading-tight text-xl md:text-2xl">
                                    SREE RAMA ENGINEERING COLLEGE
                                </h1>
                                <h2 className="header-sub text-red-700 print:text-red-700 mb-1 font-bold text-lg">(AUTONOMOUS)</h2>
                                <p className="text-[10pt] font-bold text-black leading-tight hidden md:block">Approved by AICTE, New Delhi - Affiliated to JNTUA, Ananthapuramu</p>
                                <p className="text-[10pt] font-bold text-black leading-tight hidden md:block">Accredited by NAAC with 'A' Grade & NBA (ECE & CSE)</p>
                                <p className="text-[10pt] font-bold text-black leading-tight">Rami Reddy Nagar, Karakambadi Road, Tirupati - 517507</p>
                            </div>
                        </div>

                        <div className="mt-1 border-t border-black pt-1">
                            <h3 className="header-college text-black tracking-wider mb-1 underline font-bold text-lg md:text-xl">Department of Artificial Intelligence & Data Science</h3>

                            {/* Class Details */}
                            {!isFaculty && (
                                <h4 className="header-sub mb-1 uppercase font-bold text-base">
                                    {metaData?.year ? formatYearSem(metaData.year, metaData.semester) : ' '}
                                    <span className="ml-2">({regulation})</span>
                                </h4>
                            )}
                            <h5 className="header-sub mb-1 font-bold">TIME TABLE FOR THE ACADEMIC YEAR 2025-26</h5>

                            {/* Info Line: Room, WEF */}
                            <div className="flex justify-between items-center header-sub px-4 md:px-16 mt-2 pb-2 text-sm md:text-base">
                                {/* Room No - Only show if NOT Faculty View, or if generic room needed */}
                                <div className="flex items-center gap-2">
                                    {!isFaculty && (
                                        <>
                                            <span className="font-bold">Room No:</span>
                                            <span className="font-bold border-b border-black min-w-[50px] inline-block text-center">{roomNumber}</span>
                                        </>
                                    )}
                                </div>

                                {/* WEF */}
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">W.E.F:</span>
                                    <span className="font-bold border-b border-black min-w-[80px] inline-block text-center">{wefDate || '04/01/2026'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="w-full mt-2">
                            <table className="w-full border-collapse border border-black text-center table-fixed text-[10px] md:text-xs">
                                <thead>
                                    <tr className="bg-gray-200 h-10">
                                        <th className="border border-black w-10">DAY</th>
                                        <th className="border border-black whitespace-pre-line">{timings[0]}</th>
                                        <th className="border border-black whitespace-pre-line">{timings[1]}</th>
                                        <th className="border border-black w-5 vertical-text text-[8px]">BRK</th>
                                        <th className="border border-black whitespace-pre-line">{timings[2]}</th>
                                        <th className="border border-black whitespace-pre-line">{timings[3]}</th>
                                        <th className="border border-black w-5 vertical-text text-[8px]">LCH</th>
                                        <th className="border border-black whitespace-pre-line">{timings[4]}</th>
                                        <th className="border border-black whitespace-pre-line">{timings[5]}</th>
                                        <th className="border border-black whitespace-pre-line">{timings[6]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {days.map((day) => (
                                        <tr key={day} style={{ height: '55px' }}>{/* Explicit Height for Print */}
                                            <td className="border border-black font-bold">
                                                <div>{day}</div>
                                                <div className="text-[8px] font-normal mt-1 text-gray-500 print:hidden">{weekDates[day]?.slice(5)}</div>
                                            </td>
                                            {/* P1, P2 */}
                                            {['P1', 'P2'].map(slot => {
                                                const cell = getCellContent(day, slot);
                                                return <td key={slot} className={`border border-black p-1 leading-tight font-bold align-top ${cell.type ? (cell.type.includes('rearranged') ? 'bg-yellow-50' : '') : ''}`}>
                                                    <div>{cell.text}</div>

                                                    {/* Sub Text (e.g. Covered By) */}
                                                    {cell.subText && <div className="text-[9px] font-normal italic text-gray-600 mt-1">{cell.subText}</div>}

                                                    {/* Show Room & Class for Faculty View */}
                                                    {/* Room and Class details removed for Faculty Dashboard as per request */}
                                                </td>
                                            })}

                                            {day === 'MON' && (
                                                <td rowSpan={6} className="border border-black bg-gray-100 p-0 align-middle">
                                                    <div className="flex items-center justify-center font-bold text-[8px]" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: '100%' }}>BREAK</div>
                                                </td>
                                            )}

                                            {/* P3, P4 */}
                                            {['P3', 'P4'].map(slot => {
                                                const cell = getCellContent(day, slot);
                                                return <td key={slot} className={`border border-black p-1 leading-tight font-bold align-top ${cell.type ? (cell.type.includes('rearranged') ? 'bg-yellow-50' : '') : ''}`}>
                                                    <div>{cell.text}</div>
                                                    {cell.subText && <div className="text-[9px] font-normal italic text-gray-600 mt-1">{cell.subText}</div>}

                                                    {/* Room and Class details removed for Faculty Dashboard as per request */}
                                                </td>
                                            })}

                                            {day === 'MON' && (
                                                <td rowSpan={6} className="border border-black bg-gray-100 p-0 align-middle">
                                                    <div className="flex items-center justify-center font-bold text-[8px]" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: '100%' }}>LUNCH</div>
                                                </td>
                                            )}

                                            {/* P5, P6, P7 */}
                                            {['P5', 'P6', 'P7'].map(slot => {
                                                const cell = getCellContent(day, slot);
                                                return <td key={slot} className={`border border-black p-1 leading-tight font-bold align-top ${cell.type ? (cell.type.includes('rearranged') ? 'bg-yellow-50' : '') : ''}`}>
                                                    <div>{cell.text}</div>
                                                    {cell.subText && <div className="text-[9px] font-normal italic text-gray-600 mt-1">{cell.subText}</div>}

                                                    {/* Room and Class details removed for Faculty Dashboard as per request */}
                                                </td>
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer List */}
                        {!isFaculty && (
                            <div className="mt-4 text-[10px] md:text-[11pt]">
                                <table className="w-full border-collapse border border-black text-[10px] md:text-[11pt]">
                                    <thead>
                                        <tr className="bg-gray-100 h-8">
                                            <th className="border border-black w-12 text-center p-1">S.No</th>
                                            <th className="border border-black text-center pl-3 p-1">Subject Name</th>
                                            <th className="border border-black w-32 text-center p-1">Code</th>
                                            <th className="border border-black text-center pl-3 p-1">Name of the Faculty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metaData?.subjects?.length > 0 ? (
                                            metaData.subjects.map((sub, index) => (
                                                <tr key={index} className="h-8">
                                                    <td className="border border-black text-left">{index + 1}</td>
                                                    <td className="border border-black text-left font-bold p-1">{sub.name}</td>
                                                    <td className="border border-black font-sans font-bold text-left">{sub.subjectCode || sub.code || '-'}</td>
                                                    <td className="border border-black text-left font-bold p-1">
                                                        {sub.facultyName}
                                                        {sub.facultyName2 ? ` & ${sub.facultyName2}` : ''}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="border border-black p-1 text-center">No Data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {/* Signatures & Footer Text */}
                        {!isFaculty && (
                            <>
                                <div className="signature-wrapper mt-auto break-inside-avoid">

                                    {/* Class In-charge (Moved Here) */}
                                    <div className="mb-4 pl-8 header-sub font-bold mt-6">
                                        <span>Class In-charge: </span>
                                        <span className="underline decoration-1 underline-offset-4 inline-block min-w-[200px]">
                                            {classIncharge && classIncharge.trim() !== '' ? classIncharge : '________________________'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end font-bold text-sm mt-8 px-8 mb-4 header-sub">
                                        <div className="text-center">
                                            <div className="h-10"></div>
                                            <p>CO-ORDINATOR</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="h-10"></div>
                                            <p>HOD</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="h-10"></div>
                                            <p>Principal</p>
                                        </div>
                                    </div>

                                    {/* Copy To Block */}
                                    <div className="text-left font-bold mt-4 mb-4 pl-8" style={{ fontSize: '11pt' }}>
                                        <p>Copy to</p>
                                        <ul className="list-none pl-0">
                                            <li>The Principal's Office</li>
                                            <li>The Examination Cell</li>
                                        </ul>
                                    </div>

                                    {/* Department Footer */}
                                    <div className="text-center font-bold pt-2 mb-1" style={{ fontSize: '8pt' }}>
                                        DEPT. OF ARTIFICAL INTELLIGENCE & DATA SCIENCE - SREE RAMA ENGINEERING COLLEGE
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetablePrintView;
