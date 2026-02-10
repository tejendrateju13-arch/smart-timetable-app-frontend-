import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import html2pdf from 'html2pdf.js';

const TimetablePrintView = ({ timetableData, metaData, rearrangements = [], isFacultyView = false }) => {
    const componentRef = useRef(null);
    const { currentUser } = useAuth();

    // Editable States
    const [regulation, setRegulation] = useState('R23');
    const [roomNumber, setRoomNumber] = useState('');
    const [wefDate, setWefDate] = useState('');
    const [classIncharge, setClassIncharge] = useState('');

    useEffect(() => {
        if (metaData) {
            setWefDate(metaData.wef || '');
            setRegulation(metaData.regulation || 'R23');
            setRoomNumber(metaData.roomNo || '');
            setClassIncharge(metaData.classIncharge || '');
        }
    }, [metaData]);

    const handleDownloadPDF = () => {
        const element = document.getElementById('print-area');
        const opt = {
            margin: 2, // 2mm margins (Tight fit)
            filename: `Timetable_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: element.scrollWidth, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save();
    };

    const handlePrint = () => {
        window.print();
    };

    // REFINED SINGLE PAGE PRINT STYLES - EXACT MATCH DIMENSIONS
    const PRINT_STYLES = `
        @page { size: A4 landscape; margin: 4mm; }
        @media print {
            body { margin: 0; padding: 0; }
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area {
                position: absolute; left: 0; top: 0;
                width: 280mm !important; /* Full A4 Landscape Printable Width */
                height: 190mm !important; /* Strict Height Limit for Single Page */
                margin: 0 auto; padding: 0 !important;
                overflow: hidden !important; /* Prevent 2nd page spill */
                background: white;
            }
            .no-print { display: none !important; }
        }
        .preview-wrapper { width: 297mm; padding: 5mm; background: white; margin: 0 auto; overflow-x: auto; }
        #print-area { width: 280mm; margin: 0 auto; font-family: 'Times New Roman', Times, serif; color: black; }
        
        /* Table Styles - FULL WIDTH BUT COMPACT HEIGHT */
        table { width: 100%; table-layout: fixed; border-collapse: collapse; border: 1px solid black; margin-bottom: 2px; page-break-inside: avoid; border-spacing: 0; }
        td, th { border: 1px solid black; padding: 1mm; text-align: center; vertical-align: middle; line-height: 1.0; word-wrap: break-word; overflow: hidden; white-space: normal; }
        
        /* Specific Heights & Fonts */
        th { font-weight: bold; background: #f0f0f0; font-size: 9pt; height: 9mm; } /* Compact Header 9mm */
        td { font-size: 7pt; height: 8mm; } /* Compact Body 8mm to fit vertically */
        
        /* Text Wrapping Helpers */
        .cell-content { 
            max-height: 8mm; 
            overflow: hidden; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            width: 100%;
            height: 100%; 
        }
        
        /* Header Text Styles */
        .header-college { font-size: 16pt; font-weight: 900; text-align: center; margin-bottom: 1px; line-height: 1.1; letter-spacing: 0.5px; }
        .header-sub { font-size: 11pt; font-weight: bold; text-align: center; margin-bottom: 1px; line-height: 1.1; }
        .header-details { font-size: 10pt; font-weight: bold; }
        .num-font { font-family: 'Arial', sans-serif; }
    `;

    // Determine if we should show the Faculty Layout (Hidden headers, Class info in grid)
    // Cases: Logged in as Faculty OR Admin viewing 'Faculty View'
    const showFacultyLayout = currentUser?.role === 'Faculty' || isFacultyView;

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const timings = [
        "09:40 AM\n10:40 AM",
        "10:40 AM\n11:30 AM",
        "11:40 AM\n12:30 PM",
        "12:30 PM\n01:20 PM",
        "02:00 PM\n02:50 PM",
        "02:50 PM\n03:40 PM",
        "03:40 PM\n04:30 PM"
    ];

    // Helper to strip internal IDs from Class Names (e.g. "Year 3 - A - <ID>" -> "Year 3 - A")
    const cleanClassName = (name) => {
        if (!name) return '';
        // Regex to find " - <Alphanumeric ID ~20 chars>" at the end
        // Firebase IDs are 20 chars, but let's be flexible (15-30)
        return name.replace(/\s+-\s+[a-zA-Z0-9]{15,30}$/, '').trim();
    };

    const getCellContent = (dayShort, slotId) => {
        const dayMap = { 'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday' };
        const fullDay = dayMap[dayShort];
        if (!timetableData || !timetableData[fullDay]) return { text: '---', type: 'empty' };
        const entry = timetableData[fullDay][slotId];
        if (!entry) return { text: '---', type: 'empty' };

        // Lookup Short Name if available
        let display = entry.subjectName || '---';
        const shortName = metaData?.subjects?.find(s => s.name === display)?.shortName;
        if (shortName) display = shortName;

        // For Faculty View: Append Class Info (Year/Section -> Branch is now handled by backend returning it in className usually, or we can check)
        if (showFacultyLayout && entry.className) {
            display += ` (${cleanClassName(entry.className)})`;
        }

        return {
            text: display,
            type: entry.type,
            facultyName: entry.facultyName,
            facultyName2: entry.facultyName2,
            room: entry.roomNumber
        };
    };

    const formatYearSem = (y, s) => {
        if (typeof y === 'string' && y.includes('Year')) return `${y} B.Tech ${s}`;
        const yOrd = y == 1 ? 'I' : y == 2 ? 'II' : y == 3 ? 'III' : 'IV';
        const sOrd = s == 1 ? 'I' : s == 2 ? 'II' : 'I';
        const semIsOdd = s % 2 !== 0;
        const finalSem = semIsOdd ? 'I' : 'II';
        return `${yOrd} B.Tech ${finalSem} Semester`;
    };

    return (
        <div className="p-4 w-full font-serif flex flex-col items-center">
            <style>{PRINT_STYLES}</style>

            <div className="flex gap-4 mb-4 no-print">
                <button onClick={handleDownloadPDF} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download PDF
                </button>
                <button onClick={handlePrint} className="px-6 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-700 transition-colors shadow-md flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print (Browser)
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-w-full">
                <div className="preview-wrapper">
                    <div id="print-area" ref={componentRef}>
                        {/* Header Section */}
                        <div className="flex flex-col gap-0 mb-1">
                            <div className="flex flex-row items-center justify-center gap-4 border-b-2 border-black pb-1 mb-1">
                                <div className="h-16 w-16 flex items-center justify-center shrink-0">
                                    <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                                </div>
                                <div className="text-center">
                                    <h1 className="header-college text-red-700 uppercase">
                                        SREE RAMA ENGINEERING COLLEGE
                                    </h1>
                                    <h2 className="header-sub text-red-700">(AUTONOMOUS)</h2>
                                    <p className="text-[10pt] font-bold text-black leading-tight">Approved by AICTE, New Delhi - Affiliated to JNTUA, Ananthapuramu | Accredited by NAAC with 'A' Grade</p>
                                    <p className="text-[10pt] font-bold text-black leading-tight">Rami Reddy Nagar, Karakambadi Road, Tirupati - 517507</p>
                                </div>
                            </div>

                            <div className="text-center mb-1">
                                <h3 className="text-black tracking-wide underline font-bold" style={{ fontSize: '13pt', margin: '0 0 2px 0' }}>Department of Artificial Intelligence & Data Science</h3>
                                {!showFacultyLayout && (
                                    <h4 className="header-sub mb-0 uppercase text-black" style={{ fontSize: '10pt' }}>
                                        {metaData?.year ? formatYearSem(metaData.year, metaData.semester) : 'III Year B.Tech II Semester'}
                                        <span className="ml-2">({regulation})</span>
                                    </h4>
                                )}
                                <h5 className="header-sub mb-0 text-black" style={{ fontSize: '11pt', textDecoration: 'underline' }}>
                                    TIME TABLE FOR THE ACADEMIC YEAR 2025-26
                                </h5>

                                <div className="flex justify-between items-center header-details px-12 pt-1 pb-1">
                                    <div className="flex items-center gap-2">
                                        {!showFacultyLayout && (
                                            <>
                                                <span>Room No:</span>
                                                <span className="min-w-[50px] inline-block text-center num-font">{roomNumber || '232'}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>W.E.F:</span>
                                        <span className="min-w-[80px] inline-block text-center num-font">{wefDate || '04/01/2026'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timetable Grid */}
                        <table className="w-full border-collapse border border-black text-center table-fixed margin-0">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black" style={{ width: '8.5%' }}>DAY</th>
                                    <th className="border border-black num-font whitespace-pre-line" style={{ width: '11.5%' }}>{timings[0]}</th>
                                    <th className="border border-black num-font whitespace-pre-line" style={{ width: '11.5%' }}>{timings[1]}</th>
                                    <th className="border border-black vertical-text p-0" style={{ width: '4%' }}><div style={{ writingMode: 'vertical-lr', margin: 'auto', fontSize: '8pt' }}>BRK</div></th>
                                    <th className="border border-black num-font whitespace-pre-line" style={{ width: '11.5%' }}>{timings[2]}</th>
                                    <th className="border border-black num-font whitespace-pre-line" style={{ width: '11.5%' }}>{timings[3]}</th>
                                    <th className="border border-black vertical-text p-0" style={{ width: '4%' }}><div style={{ writingMode: 'vertical-lr', margin: 'auto', fontSize: '8pt' }}>LCH</div></th>
                                    <th className="border border-black num-font whitespace-pre-line" style={{ width: '12.5%' }}>{timings[4]}</th>
                                    <th className="border border-black num-font whitespace-pre-line" style={{ width: '12.5%' }}>{timings[5]}</th>
                                    <th className="border border-black num-font whitespace-pre-line" style={{ width: '12%' }}>{timings[6]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {days.map((day) => (
                                    <tr key={day} style={{ height: '8mm' }}>
                                        <td className="border border-black font-bold">{day}</td>
                                        {['P1', 'P2'].map(slot => {
                                            const cell = getCellContent(day, slot);
                                            return <td key={slot} className="border border-black font-bold leading-tight">
                                                <div className="cell-content">{cell.text}</div>
                                            </td>
                                        })}
                                        {day === 'MON' && (
                                            <td rowSpan={6} className="border border-black bg-gray-50 p-0 align-middle">
                                                <div className="flex items-center justify-center font-bold" style={{ writingMode: 'vertical-lr', height: '100%', width: '100%', fontSize: '8pt' }}>BREAK</div>
                                            </td>
                                        )}
                                        {['P3', 'P4'].map(slot => {
                                            const cell = getCellContent(day, slot);
                                            return <td key={slot} className="border border-black font-bold leading-tight">
                                                <div className="cell-content">{cell.text}</div>
                                            </td>
                                        })}
                                        {day === 'MON' && (
                                            <td rowSpan={6} className="border border-black bg-gray-50 p-0 align-middle">
                                                <div className="flex items-center justify-center font-bold" style={{ writingMode: 'vertical-lr', height: '100%', width: '100%', fontSize: '8pt' }}>LUNCH</div>
                                            </td>
                                        )}
                                        {['P5', 'P6', 'P7'].map(slot => {
                                            const cell = getCellContent(day, slot);
                                            return <td key={slot} className="border border-black font-bold leading-tight">
                                                <div className="cell-content">{cell.text}</div>
                                            </td>
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Subject List */}
                        <div className="mt-2" style={{ pageBreakInside: 'avoid' }}>
                            <table className="w-full border-collapse border border-black footer-text" style={{ fontSize: '7pt' }}>
                                <thead>
                                    <tr className="bg-gray-100 h-4">
                                        <th className="border border-black text-center" style={{ width: '5%', height: '5mm', fontSize: '7.5pt', padding: '1mm' }}>S.No</th>
                                        <th className="border border-black text-left" style={{ width: '45%', height: '5mm', fontSize: '7.5pt', padding: '1mm' }}>Subject Name</th>
                                        <th className="border border-black text-center" style={{ width: '15%', height: '5mm', fontSize: '7.5pt', padding: '1mm' }}>Code</th>
                                        <th className="border border-black text-left" style={{ width: '35%', height: '5mm', fontSize: '7.5pt', padding: '1mm' }}>
                                            {showFacultyLayout ? 'Class / Section' : 'Name of the Faculty'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let displaySubjects = [];
                                        if (showFacultyLayout && timetableData) {
                                            const uniqueMap = new Map();
                                            Object.values(timetableData).forEach(daySlots => {
                                                Object.values(daySlots).forEach(slot => {
                                                    if (slot.subjectName) {
                                                        const key = `${slot.subjectName}-${slot.className}`;
                                                        if (!uniqueMap.has(key)) {
                                                            uniqueMap.set(key, {
                                                                name: slot.subjectName,
                                                                code: slot.subjectCode || '-',
                                                                facultyName: slot.className || '-'
                                                            });
                                                        }
                                                    }
                                                });
                                            });
                                            displaySubjects = Array.from(uniqueMap.values());
                                        } else {
                                            displaySubjects = metaData?.subjects || [];
                                        }

                                        return displaySubjects.length > 0 ? (
                                            displaySubjects.map((sub, index) => (
                                                <tr key={index} className="h-4">
                                                    <td className="border border-black text-center num-font" style={{ height: '5mm', padding: '1mm' }}>{index + 1}</td>
                                                    <td className="border border-black font-bold text-left" style={{ height: '5mm', padding: '1mm' }}>{sub.name}</td>
                                                    <td className="border border-black text-center num-font" style={{ height: '5mm', padding: '1mm' }}>{sub.subjectCode || sub.code || '-'}</td>
                                                    <td className="border border-black font-bold text-left" style={{ height: '5mm', padding: '1mm' }}>
                                                        {showFacultyLayout ? cleanClassName(sub.facultyName) : sub.facultyName}
                                                        {sub.facultyName2 ? ` & ${sub.facultyName2}` : ''}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="border border-black p-0 text-center">No Data</td></tr>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Signatures */}
                        {!showFacultyLayout && (
                            <div className="mt-4 font-bold" style={{ pageBreakInside: 'avoid', fontSize: '8pt' }}>
                                <div className="mb-1 pl-4 text-left">
                                    <span>Class In-charge: </span>
                                    <span className="inline-block min-w-[200px] pl-2">{classIncharge || ''}</span>
                                </div>
                                <div className="flex justify-between items-end mt-6 px-8">
                                    <div className="text-center w-36"><p className="pt-1">CO-ORDINATOR</p></div>
                                    <div className="text-center w-36"><p className="pt-1">HOD</p></div>
                                    <div className="text-center w-36"><p className="pt-1">Principal</p></div>
                                </div>
                                <div className="text-left mt-2 pl-4 text-[7pt]">
                                    <p>Copy to:</p>
                                    <ul className="list-disc pl-5 m-0 leading-tight">
                                        <li>The Principal's Office</li>
                                        <li>The Examination Cell</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default TimetablePrintView;
