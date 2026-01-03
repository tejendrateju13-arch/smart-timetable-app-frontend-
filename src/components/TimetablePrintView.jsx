import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const TimetablePrintView = ({ timetableData, metaData, rearrangements = [] }) => {
    const componentRef = useRef(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Timetable_${new Date().toISOString().slice(0, 10)}`,
        pageStyle: `
            @page {
                size: A4 landscape;
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
                .no-print {
                    display: none;
                }
            }
        `
    });

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Safely access cell data without crashing
    const getCellContent = (dayShort, slotId) => {
        const dayMap = {
            'MON': 'Monday',
            'TUE': 'Tuesday',
            'WED': 'Wednesday',
            'THU': 'Thursday',
            'FRI': 'Friday',
            'SAT': 'Saturday'
        };
        const fullDay = dayMap[dayShort];
        const toDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        // 0. Check for Dynamic Rearrangements (Today Only)
        if (rearrangements && rearrangements.length > 0 && fullDay === toDayName) {
            const patch = rearrangements.find(r => r.slotId.toString() === slotId.toString() || r.slotId === slotId);
            if (patch) {
                if (patch.type === 'cover') {
                    // I am covering someone else
                    return {
                        text: `COVERING: ${patch.originalFacultyName || patch.urgentFacultyName || 'Faculty'}`,
                        type: 'Substitution',
                        style: 'bg-green-100 font-bold border-2 border-green-500 text-green-900'
                    };
                } else {
                    // I am absent, someone else is covering
                    return {
                        text: `ALTERNATE (${patch.substituteName || 'Sub'})`,
                        type: 'Substitution',
                        style: 'bg-orange-50 text-orange-900 font-bold border border-orange-200'
                    };
                }
            }
        }

        // 1. Check if timetableData exists
        if (!timetableData) return { text: '---', type: 'empty' };

        // 2. Check if the specific day exists in data
        const dayData = timetableData[fullDay];
        if (!dayData) return { text: '---', type: 'empty' };

        // 3. Check if slot exists
        const entry = dayData[slotId];
        if (!entry) return { text: '---', type: 'empty' };

        let display = entry.subjectName || '---';

        // Plain Subject Name only as per request
        // if (entry.classroom) display += ` (${entry.classroom})`;
        // else if (entry.roomNumber) display += ` (${entry.roomNumber})`;

        // Highlight rearranged/substituted slots (Legacy / Permanent method support)
        const style = entry.isRearranged ? 'bg-yellow-200 font-bold' : '';

        return { text: display, type: entry.type, style };
    };

    return (
        <div className="p-4">
            <button onClick={handlePrint} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">
                Print / Save PDF
            </button>

            <div ref={componentRef} className="bg-white text-black font-serif border-2 border-black max-w-5xl mx-auto print:max-w-none print:w-full print:border-0">
                <div className="p-1 md:p-8">
                    {/* Header */}
                    <div className="text-center border-b-2 border-black pb-2 mb-2">
                        <div className="flex flex-row items-center justify-center gap-2 md:gap-4">
                            {/* Logo */}
                            <div className="h-10 w-10 md:h-24 md:w-24 flex items-center justify-center">
                                <img src="/logo.png" alt="SRET Logo" className="h-full w-full object-contain" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-xs md:text-2xl font-bold uppercase text-red-700 leading-tight">Sree Rama Engineering College</h1>
                                <h2 className="text-[8px] md:text-sm font-bold uppercase text-gray-700">(AUTONOMOUS)</h2>
                                <p className="text-[6px] md:text-[10px] text-gray-600 hidden md:block">Approved by AICTE, New Delhi - Affiliated to JNTUA, Ananthapuramu</p>
                                <p className="text-[6px] md:text-[10px] text-gray-600 md:hidden">Tirupati - 517507</p>
                            </div>
                        </div>
                        <div className="mt-1 border-t border-black pt-1">
                            <h3 className="font-bold underline uppercase text-[10px] md:text-lg">Dept of AI & Data Science</h3>
                            <h4 className="font-bold text-[8px] md:text-base">
                                {metaData?.year ? (
                                    `${metaData.year}${['st', 'nd', 'rd'][metaData.year - 1] || 'th'} Year B.Tech ${metaData.semester}${['st', 'nd', 'rd'][metaData.semester - 1] || 'th'} Sem (R23)`
                                ) : 'III Year B.Tech II Semester (R23)'}
                            </h4>
                            <div className="flex justify-between items-center text-[8px] md:text-[10px] uppercase font-bold mt-1 px-1">
                                <span>TIME TABLE 2025-26</span>
                                <span>WEF: {metaData?.wef || '24-11-2025'}</span>
                            </div>
                            {metaData?.rearrangementDate && (
                                <div className="bg-yellow-100 border-2 border-yellow-400 p-1 mt-1 text-xs font-black text-center text-yellow-800 animate-pulse">
                                    RE-ARRANGED TIMETABLE FOR {metaData.rearrangementDate}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grid - FIXED WIDTH on Mobile (No Scroll) */}
                    <div className="w-full">
                        <table className="w-full border-collapse border border-black text-center table-fixed">
                            <thead>
                                <tr className="bg-gray-200 text-[8px] md:text-xs">
                                    <th className="border border-black p-0.5 md:p-1 w-[8%]">DAY</th>
                                    <th className="border border-black p-0.5 md:p-1">09:40<br />10:40</th>
                                    <th className="border border-black p-0.5 md:p-1">10:40<br />11:30</th>
                                    <th className="border border-black p-0 md:p-1 w-[4%] vertical-text text-[6px] md:text-xs">BRK</th>
                                    <th className="border border-black p-0.5 md:p-1">11:40<br />12:30</th>
                                    <th className="border border-black p-0.5 md:p-1">12:30<br />01:20</th>
                                    <th className="border border-black p-0 md:p-1 w-[4%] vertical-text text-[6px] md:text-xs">LCH</th>
                                    <th className="border border-black p-0.5 md:p-1">02:00<br />02:50</th>
                                    <th className="border border-black p-0.5 md:p-1">02:50<br />03:40</th>
                                    <th className="border border-black p-0.5 md:p-1">03:40<br />04:40</th>
                                </tr>
                            </thead>
                            <tbody>
                                {days.map((day) => (
                                    <tr key={day} className="h-8 md:h-12 text-[7px] md:text-[10px]">
                                        <td className="border border-black font-bold bg-gray-100 p-0.5 align-middle">{day}</td>
                                        {['P1', 'P2'].map(slot => {
                                            const cell = getCellContent(day, slot);
                                            return <td key={slot} className={`border border-black p-0.5 break-words ${cell.style || ''}`}>{cell.text}</td>
                                        })}

                                        {day === 'MON' && (
                                            <td rowSpan={6} className="border border-black bg-gray-100 p-0 align-middle">
                                                <div className="h-full w-full flex items-center justify-center font-bold text-[6px] md:text-xs" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>BREAK</div>
                                            </td>
                                        )}

                                        {['P3', 'P4'].map(slot => {
                                            const cell = getCellContent(day, slot);
                                            return <td key={slot} className={`border border-black p-0.5 break-words ${cell.style || ''}`}>{cell.text}</td>
                                        })}

                                        {day === 'MON' && (
                                            <td rowSpan={6} className="border border-black bg-gray-100 p-0 align-middle">
                                                <div className="h-full w-full flex items-center justify-center font-bold text-[6px] md:text-xs" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>LUNCH</div>
                                            </td>
                                        )}

                                        {['P5', 'P6', 'P7'].map(slot => {
                                            const cell = getCellContent(day, slot);
                                            return <td key={slot} className={`border border-black p-0.5 break-words ${cell.style || ''}`}>{cell.text}</td>
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Subjects */}
                    <div className="mt-2 md:mt-4">
                        <h5 className="font-bold text-[8px] md:text-xs mb-1 underline">Subjects & Faculty:</h5>
                        <div className="overflow-hidden"> {/* Ensure no scroll here either if user wants fixed */}
                            <table className="w-full border-collapse border border-black text-[7px] md:text-xs">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-0.5 w-6">S.No</th>
                                        <th className="border border-black p-0.5">Subject</th>
                                        <th className="border border-black p-0.5 w-12">Code</th>
                                        <th className="border border-black p-0.5">Faculty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metaData?.subjects?.length > 0 ? (
                                        metaData.subjects.map((sub, index) => (
                                            <tr key={index}>
                                                <td className="border border-black p-0.5 text-center">{index + 1}</td>
                                                <td className="border border-black p-0.5 font-semibold truncate max-w-[80px] md:max-w-none">{sub.name}</td>
                                                <td className="border border-black p-0.5 text-center">{sub.code || '-'}</td>
                                                <td className="border border-black p-0.5 truncate max-w-[60px] md:max-w-none">{sub.facultyName || 'TBD'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="border border-black p-1 text-center italic">No subjects</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between mt-8 md:mt-16 px-2 md:px-12 font-bold text-[8px] md:text-sm">
                        <div className="text-center">
                            <p>TT In-charge</p>
                        </div>
                        <div className="text-center">
                            <p>HOD</p>
                        </div>
                        <div className="text-center">
                            <p>Principal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetablePrintView;
