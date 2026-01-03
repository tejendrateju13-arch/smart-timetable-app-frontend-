import React from 'react';

/**
 * TimetableGrid Component
 * @param {object} schedule - The generated schedule object { Friday: { P1: {...} }, ... }
 * @param {array} slots - Time slot definitions [{id, start, end, isBreak}]
 */
export default function TimetableGrid({ schedule, slots = [], role = 'Admin', userUid = null, rearrangements = [] }) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Default slot definitions if not provided
    const defaultSlots = [
        { id: 'P1', start: '09:00', end: '09:50', isBreak: false },
        { id: 'P2', start: '09:50', end: '10:40', isBreak: false },
        { id: 'P3', start: '10:40', end: '11:30', isBreak: false },
        { id: 'SB', start: '11:30', end: '11:40', isBreak: true },
        { id: 'P4', start: '11:40', end: '12:30', isBreak: false },
        { id: 'LB', start: '12:30', end: '13:20', isBreak: true },
        { id: 'P5', start: '13:20', end: '14:10', isBreak: false },
        { id: 'P6', start: '14:10', end: '15:00', isBreak: false },
        { id: 'P7', start: '15:00', end: '15:50', isBreak: false }
    ];

    const displaySlots = slots.length > 0 ? slots : defaultSlots;

    const getCellContent = (day, slotId) => {
        if (!schedule || !schedule[day]) return null;
        const entry = schedule[day][slotId];

        // ... FACULTY FILTER ...

        // FACULTY FILTER: Only show their own classes
        if (role === 'Faculty' && entry && entry.type !== 'Break') {
            // We assume entry.facultyId exists or we match by facultyName if ID is missing (fallback)
            if (entry.facultyId !== userUid && entry.facultyName !== userUid) {
                return null;
            }
        }

        return entry;
    };

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
            <table className="w-full border-collapse min-w-[700px] md:min-w-[1000px]">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-2 md:p-4 border-r border-gray-200 text-gray-500 font-bold uppercase text-[10px] md:text-xs w-20 md:w-32">Day / Slot</th>
                        {displaySlots.map((slot) => (
                            <th key={slot.id} className={`p-2 md:p-4 text-center border-r border-gray-200 last:border-r-0 ${slot.isBreak ? 'bg-orange-50 w-8 md:w-20' : 'flex-1'}`}>
                                <div className="text-blue-600 font-bold text-xs md:text-base">{slot.id}</div>
                                <div className="text-[9px] md:text-[10px] text-gray-400 font-medium whitespace-nowrap">{slot.start} - {slot.end}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map((day) => (
                        <tr key={day} className="border-b border-gray-200 last:border-b-0 group">
                            <td className="p-2 md:p-4 border-r border-gray-200 bg-gray-50 font-bold text-gray-700 text-xs md:text-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                                {day.slice(0, 3)}<span className="hidden md:inline">{day.slice(3)}</span>
                            </td>
                            {displaySlots.map((slot, idx) => {
                                const entry = getCellContent(day, slot.id);

                                if (slot.isBreak) {
                                    return (
                                        <td key={`${day}-${slot.id}`} className="p-1 md:p-2 bg-orange-50 border-r border-gray-200 last:border-r-0 text-center">
                                            <div className="vertical-text text-[8px] md:text-[10px] font-bold text-orange-400 tracking-widest uppercase">
                                                {slot.id === 'LB' ? (window.innerWidth < 768 ? 'L' : 'LUNCH') : 'B'}
                                            </div>
                                        </td>
                                    );
                                }

                                if (!entry) {
                                    return <td key={`${day}-${slot.id}`} className="p-2 md:p-4 border-r border-gray-200 last:border-r-0 bg-gray-50/30"></td>;
                                }

                                // Handle Lab merging (span 3 slots)
                                if (entry.type === 'Lab') {
                                    const prevSlot = displaySlots[idx - 1];
                                    const prevEntry = prevSlot ? getCellContent(day, prevSlot.id) : null;
                                    if (prevEntry && prevEntry.subjectId === entry.subjectId) {
                                        return null;
                                    }

                                    return (
                                        <td
                                            key={`${day}-${slot.id}`}
                                            colSpan={3}
                                            className="p-1 md:p-3 border-r border-gray-200 last:border-r-0"
                                        >
                                            <div className="bg-indigo-600 text-white p-2 md:p-3 rounded-md md:rounded-lg shadow-md h-full flex flex-col justify-center transform hover:scale-[1.02] transition cursor-help border-b-4 border-indigo-800">
                                                <div className="text-[8px] md:text-xs font-bold uppercase opacity-80 mb-1">Lab</div>
                                                <div className="font-bold text-xs md:text-base leading-tight truncate">{entry.subjectName}</div>
                                                <div className="text-xs mt-2 flex justify-end items-center bg-indigo-700/50 p-1 rounded hidden md:flex">
                                                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{entry.roomNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                }

                                return (
                                    <td key={`${day}-${slot.id}`} className="p-1 md:p-3 border-r border-gray-200 last:border-r-0 group/cell">
                                        <div className="bg-white border border-blue-100 p-1 md:p-2.5 rounded-md md:rounded-lg shadow-sm h-full hover:shadow-md hover:border-blue-400 transition group-hover/cell:bg-blue-50/50 flex flex-col justify-center">
                                            <div className="font-bold text-gray-800 text-[10px] md:text-[11px] mb-0.5 leading-tight" title={entry.subjectName}>
                                                {entry.subjectName}
                                            </div>
                                            <div className="flex justify-between items-center mt-auto">
                                                <span className="text-[8px] md:text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded border border-gray-200">{entry.roomNumber}</span>
                                                <span className="hidden md:inline text-[8px] font-bold text-gray-400 uppercase">{entry.type}</span>
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <style dangerouslySetInnerHTML={{
                __html: `
                .vertical-text {
                    writing-mode: vertical-lr;
                    text-orientation: upright;
                    display: inline-block;
                    margin: 0 auto;
                }
            `}} />
        </div>
    );
}
