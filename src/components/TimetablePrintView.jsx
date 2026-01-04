import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';

const TimetablePrintView = ({ timetableData, metaData, rearrangements = [] }) => {
    const componentRef = useRef(null);
    const { currentUser } = useAuth();

    // Editable States
    const [regulation, setRegulation] = useState('R23');
    const [roomNumber, setRoomNumber] = useState('');
    const [wefDate, setWefDate] = useState('');
    const [classIncharge, setClassIncharge] = useState('');

    useEffect(() => {
        if (metaData) {
            if (metaData.wef) setWefDate(metaData.wef);
            if (metaData.regulation) setRegulation(metaData.regulation);
            if (metaData.roomNo) setRoomNumber(metaData.roomNo);
            if (metaData.classIncharge) setClassIncharge(metaData.classIncharge);
        }
    }, [metaData]);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Timetable_${new Date().toISOString().slice(0, 10)}`,
        pageStyle: `
            @page {
                size: A4 portrait;
                margin: 5mm 10mm;
            }
            @media print {
                html, body {
                    height: auto !important;
                    min-height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: visible !important;
                }

                #root {
                    display: none !important;
                }

                .print-root {
                    display: block !important;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }

                /* MAIN CONTAINER */
                .print-container {
                    display: flex !important;
                    flex-direction: column !important;
                    width: 100% !important;
                    height: 98vh !important;
                    
                    zoom: 0.70 !important; 
                    
                    margin: 0 !important;
                    padding: 0 10px !important;
                    border: none !important;
                    background: white !important;
                    color: black !important;
                    font-family: 'Times New Roman', Times, serif !important;
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
                }
                th, td {
                    border: 1px solid black !important;
                    padding: 4px !important; /* Padding 4px */
                    font-size: 10.5pt !important; /* Font Size 10.5pt */
                    line-height: 1.1 !important; /* Line Height 1.1 */
                    font-family: 'Times New Roman', Times, serif !important;
                }
                
                /* DAY Column Specific */
                th:first-child, td:first-child {
                    width: 80px !important; /* 80px Width */
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
                    margin-top: auto !important;
                    font-size: 11pt !important;
                }
            }
        `
    });

    const isFaculty = currentUser?.role === 'faculty';
    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'hod';
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

        if (!timetableData || !timetableData[fullDay]) return { text: '---', type: 'empty' };

        const entry = timetableData[fullDay][slotId];
        if (!entry) return { text: '---', type: 'empty' };

        let display = entry.subjectName || '---';

        // Show 2nd faculty if exists (Lab)
        if (entry.type === 'Lab' && entry.facultyName2) {
            // display += ` & ${entry.facultyName2}`; // Option: Add to subject line?
            // Usually Fac names are in footer, but if user wants in cell:
        }

        return {
            text: display,
            type: entry.type,
            facultyName: entry.facultyName,
            facultyName2: entry.facultyName2, // Pass it out
            room: entry.roomNumber
        };
    };

    const formatYearSem = (y, s) => {
        if (typeof y === 'string' && y.includes('Year')) return `${y} B.Tech ${s}`;
        // eslint-disable-next-line eqeqeq
        const yOrd = y == 1 ? 'I' : y == 2 ? 'II' : y == 3 ? 'III' : 'IV';
        // eslint-disable-next-line eqeqeq
        const sOrd = s == 1 ? 'I' : s == 2 ? 'II' : 'I'; // Sem is usually I or II
        // Logic check: Sem 1->I, 2->II, 3->I, 4->II...
        const semIsOdd = s % 2 !== 0;
        const finalSem = semIsOdd ? 'I' : 'II';

        return `${yOrd} B.Tech ${finalSem} Semester`;
    };

    return (
        <div className="p-4 w-full font-serif">
            <button onClick={handlePrint} className="no-print mb-4 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">
                Print / Save PDF (Corrected Format)
            </button>

            <div className={`overflow-x-auto w-full bg-white ${currentUser ? 'shadow-lg border border-gray-200 rounded-lg' : ''}`}>
                <div ref={componentRef} className="print-container bg-white text-black relative p-8 w-full max-w-[1100px] mx-auto font-serif">

                    {/* Header */}
                    <div className="text-center border-b-2 border-black pb-1 mb-1">
                        <div className="flex flex-row items-center justify-between px-2 gap-2">
                            {/* Logo */}
                            <div className="h-20 w-20 flex items-center justify-center">
                                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                            </div>

                            <div className="text-center flex-1">
                                <h1 className="header-college mb-1 text-red-700 print:text-red-700 font-black tracking-widest leading-tight" style={{ fontSize: '20pt', fontWeight: '900' }}>
                                    <span style={{ letterSpacing: '2px' }}>SREE RAMA ENGINEERING</span><br />
                                    <span style={{ letterSpacing: '4px' }}>COLLEGE</span>
                                </h1>
                                <h2 className="header-sub text-red-700 print:text-red-700 mb-1 font-bold" style={{ fontSize: '14pt' }}>(AUTONOMOUS)</h2>
                                <p className="text-[10pt] font-bold text-black leading-tight">Approved by AICTE, New Delhi - Affiliated to JNTUA, Ananthapuramu</p>
                                <p className="text-[10pt] font-bold text-black leading-tight">Accredited by NAAC with 'A' Grade & NBA (ECE & CSE)</p>
                                <p className="text-[10pt] font-bold text-black leading-tight">Rami Reddy Nagar, Karakambadi Road, Tirupati - 517507</p>
                            </div>

                            {/* Logo Spacer */}
                            <div className="h-20 w-20 opacity-0"></div>
                        </div>

                        <div className="mt-1 border-t border-black pt-1">
                            <h3 className="header-college text-black tracking-wider mb-1 underline font-bold" style={{ fontSize: '15pt' }}>Department of Artificial Intelligence & Data Science</h3>

                            {/* Class Details */}
                            <h4 className="header-sub mb-1 uppercase font-bold" style={{ fontSize: '12pt' }}>
                                {metaData?.year ? formatYearSem(metaData.year, metaData.semester) : 'III Year B.Tech II Semester'}
                                <span className="ml-2">({regulation})</span>
                            </h4>
                            <h5 className="header-sub mb-1 font-bold">TIME TABLE FOR THE ACADEMIC YEAR 2025-26</h5>

                            {/* Info Line: Room, WEF */}
                            <div className="flex justify-between items-center header-sub px-16 mt-2 pb-2">
                                {/* Room No */}
                                <div className="flex items-center gap-2">
                                    {!isFaculty && (
                                        <>
                                            <span className="font-bold">Room No:</span>
                                            <span className="font-bold border-b border-black min-w-[50px] inline-block text-center">{roomNumber || '232'}</span>
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
                            <table className="w-full border-collapse border border-black text-center table-fixed text-[10px]">
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
                                        <tr key={day} style={{ height: '55px' }}> {/* Explicit Height for Print */}
                                            <td className="border border-black font-bold">{day}</td>

                                            {/* P1, P2 */}
                                            {['P1', 'P2'].map(slot => {
                                                const cell = getCellContent(day, slot);
                                                return <td key={slot} className="border border-black p-1 leading-tight font-bold">
                                                    {cell.text}
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
                                                return <td key={slot} className="border border-black p-1 leading-tight font-bold">
                                                    {cell.text}
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
                                                return <td key={slot} className="border border-black p-1 leading-tight font-bold">
                                                    {cell.text}
                                                </td>
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer List */}
                        <div className="mt-4 text-[11pt]">
                            <table className="w-full border-collapse border border-black text-[11pt]">
                                <thead>
                                    <tr className="bg-gray-100 h-8">
                                        <th className="border border-black w-12 text-center p-1">S.No</th>
                                        <th className="border border-black text-left pl-3 p-1">Subject Name</th>
                                        <th className="border border-black w-32 text-center p-1">Code</th>
                                        <th className="border border-black text-left pl-3 p-1">Name of the Faculty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metaData?.subjects?.length > 0 ? (
                                        metaData.subjects.map((sub, index) => (
                                            <tr key={index} className="h-8">
                                                <td className="border border-black text-center p-1">{index + 1}</td>
                                                <td className="border border-black pl-3 font-bold p-1">{sub.name}</td>
                                                <td className="border border-black text-center p-1">{sub.subjectCode || sub.code || '-'}</td>
                                                <td className="border border-black pl-3 font-bold p-1">
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

                        {/* Signatures & Footer Text */}
                        <div className="signature-wrapper mt-auto">

                            {/* Class In-charge (Moved Here) */}
                            <div className="mb-4 pl-8 header-sub font-bold mt-6"> {/* Added mt-6 for spacing */}
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

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetablePrintView;
