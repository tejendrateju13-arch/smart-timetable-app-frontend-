import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TARGET_CONFIG = {
    faculty: {
        label: 'Faculty Members',
        fields: ['id', 'name', 'email', 'designation', 'departmentId', 'maxClassesPerDay'],
        apiPath: '/faculty'
    },
    students: {
        label: 'Students List',
        fields: ['studentId', 'name', 'email', 'departmentId', 'year', 'semester', 'section'],
        apiPath: '/students'
    },
    subjects: {
        label: 'Subject Catalog',
        fields: ['code', 'name', 'type', 'hoursPerWeek', 'departmentId', 'semester'],
        apiPath: '/subjects'
    },
    classrooms: {
        label: 'Classrooms / Labs',
        fields: ['roomNumber', 'roomType', 'capacity'],
        apiPath: '/classrooms'
    }
};

export default function FileUpload() {
    const [target, setTarget] = useState('faculty');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [extractedData, setExtractedData] = useState([]);
    const [deptList, setDeptList] = useState([]);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchDepts();
    }, []);

    const fetchDepts = async () => {
        try {
            const res = await api.get('/departments');
            setDeptList(res.data);
        } catch (err) {
            console.error("Error fetching departments", err);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
        setExtractedData([]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('target', target);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(`Found ${res.data.count} records. Please verify before importing.`);
            setExtractedData(res.data.data || []);
        } catch (err) {
            console.error(err);
            setMessage('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const handleCellChange = (rowIndex, field, value) => {
        const newData = [...extractedData];
        newData[rowIndex][field] = value;
        setExtractedData(newData);
    };

    const handleConfirmImport = async () => {
        if (extractedData.length === 0) return;
        setImporting(true);
        let successCount = 0;
        let failCount = 0;

        try {
            const config = TARGET_CONFIG[target];
            for (const item of extractedData) {
                try {
                    // Basic cleanup: trim strings & parse numbers
                    const payload = { ...item };
                    if (payload.year) payload.year = parseInt(payload.year) || 1;
                    if (payload.semester) payload.semester = parseInt(payload.semester) || 1;
                    if (payload.hoursPerWeek) payload.hoursPerWeek = parseInt(payload.hoursPerWeek) || 3;
                    if (payload.capacity) payload.capacity = parseInt(payload.capacity) || 60;
                    if (payload.maxClassesPerDay) payload.maxClassesPerDay = parseInt(payload.maxClassesPerDay) || 4;

                    await api.post(config.apiPath, payload);
                    successCount++;
                } catch (err) {
                    failCount++;
                    console.error("Failed to import individual record", err);
                }
            }
            setMessage(`Import complete! Success: ${successCount}, Failed: ${failCount}`);
            if (failCount === 0) {
                setExtractedData([]);
                setFile(null);
            }
        } catch (err) {
            console.error(err);
            setMessage('Critical error during import.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-black mb-2 text-gray-800 uppercase tracking-tighter">Universal Data Import</h2>
            <p className="text-gray-500 mb-8 font-medium">Upload any file format and map it to your college database automatically.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1: Select Data Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(TARGET_CONFIG).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => { setTarget(key); setExtractedData([]); }}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${target === key ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                                >
                                    <span className={`block text-xs font-black uppercase tracking-tighter ${target === key ? 'text-blue-700' : 'text-gray-500'}`}>{cfg.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 2: Upload Document</label>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-all bg-gray-50/50">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    id="fileInput"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="pointer-events-none">
                                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-3 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm font-bold text-gray-600">{file ? file.name : 'Select CSV, Excel, PDF, Docx or Image'}</p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={!file || uploading}
                                className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest transition-all ${!file || uploading ? 'bg-gray-200' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100'}`}
                            >
                                {uploading ? 'Analyzing...' : 'Parse Data'}
                            </button>
                        </form>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl font-bold text-sm ${message.includes('Success') || message.includes('Found') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden h-full flex flex-col min-h-[500px]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-gray-800 uppercase tracking-tighter">Step 3: Verify & Edit Extracted Data</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Automatic column mapping applied</p>
                            </div>
                            {extractedData.length > 0 && (
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={importing}
                                    className={`px-6 py-2 rounded-lg text-white font-black uppercase tracking-widest text-xs transition-all ${importing ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100'}`}
                                >
                                    {importing ? 'Importing...' : 'Save to Database'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto">
                            {extractedData.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            {TARGET_CONFIG[target].fields.map(f => (
                                                <th key={f} className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b whitespace-nowrap">{f}</th>
                                            ))}
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Raw/Unmapped</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {extractedData.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-blue-50/30 transition-colors">
                                                {TARGET_CONFIG[target].fields.map(field => (
                                                    <td key={field} className="p-2 border-r border-gray-50">
                                                        <input
                                                            value={row[field] || ''}
                                                            onChange={(e) => handleCellChange(rowIndex, field, e.target.value)}
                                                            className={`w-full p-2 text-sm bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded outline-none transition-all ${!row[field] ? 'border border-red-200 bg-red-50/30' : 'border border-transparent'}`}
                                                            placeholder={`missing ${field}`}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-4 text-[10px] text-gray-300 font-mono italic max-w-xs truncate">
                                                    {Object.entries(row)
                                                        .filter(([k]) => !TARGET_CONFIG[target].fields.includes(k))
                                                        .map(([k, v]) => `${k}:${v}`).join(', ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-300">
                                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                    <p className="font-bold text-lg">No Data to Preview</p>
                                    <p className="text-sm max-w-xs mx-auto mt-2">Choose a type and upload a document to begin the extraction process.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
