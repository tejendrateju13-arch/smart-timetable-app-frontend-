import React, { useState } from 'react';
import api from '../../services/api';
import { useDepartment } from '../../context/DepartmentContext';

export default function UploadData() {
    const [target, setTarget] = useState('faculty');
    const [file, setFile] = useState(null);
    const [extractedData, setExtractedData] = useState([]);
    const [dataType, setDataType] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Confirm

    const { currentDept } = useDepartment();
    const [departmentId, setDepartmentId] = useState('');
    const [departments, setDepartments] = useState([]);

    React.useEffect(() => {
        if (currentDept?.id) {
            setDepartmentId(currentDept.id);
        }
    }, [currentDept]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
    };

    const handleUpload = async () => {
        if (!file) return setMessage('Please select a file');

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target', target);

        try {
            const res = await api.post('/upload/extract', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setExtractedData(res.data.data);
            setDataType(res.data.type);
            setStep(2);
            setMessage(`Found ${res.data.count} records.`);
        } catch (error) {
            console.error(error);
            setMessage('Extraction failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setLoading(true);
        try {
            // Include departmentId if selected manually for students/subjects logic
            const payload = {
                data: extractedData,
                type: target, // Use the target selected by user instead of auto-detected if ambiguous
                departmentId
            };

            const res = await api.post('/upload/import', payload);
            setMessage(res.data.message);
            setStep(3); // Done
            setTimeout(() => {
                setStep(1);
                setFile(null);
                setExtractedData([]);
                setMessage('');
            }, 3000);
        } catch (error) {
            setMessage('Import failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-600 p-4 rounded-lg shadow-sm mb-6">
                <h1 className="text-xl font-black text-white text-center uppercase tracking-widest">
                    ARTIFICIAL INTELLIGENCE AND DATA SCIENCE (AI&DS)
                </h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Upload & Import Data</h2>

            {/* Target Selector */}
            <div className="flex space-x-4 border-b">
                {['faculty', 'students', 'subjects', 'classrooms'].map(t => (
                    <button
                        key={t}
                        onClick={() => { setTarget(t); setStep(1); setExtractedData([]); setMessage(''); }}
                        className={`py-2 px-4 font-medium ${target === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white p-6 rounded-lg shadow-md min-h-[400px]">
                {message && <div className={`p-3 mb-4 rounded ${message.includes('failed') || message.includes('No') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{message}</div>}

                {step === 1 && (
                    <div className="flex flex-col items-center justify-center space-y-6 py-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <div className="text-center">
                            <p className="text-gray-600 mb-2">Upload CSV, Excel, PDF, or DOCX containing <strong>{target}</strong> data.</p>
                            <p className="text-xs text-gray-400">Supported columns: Name, Email, Dept, etc.</p>
                        </div>

                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls,.pdf,.docx,.doc,image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                w-auto"
                        />

                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className={`px-8 py-2 rounded text-white font-semibold shadow-sm
                                ${!file || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Processing...' : 'Upload & Process'}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Preview Data ({extractedData.length} records)</h3>
                            <div className="space-x-2">
                                <button onClick={() => setStep(1)} className="text-gray-600 hover:underline px-3">Cancel</button>
                                <button
                                    onClick={handleImport}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 shadow-sm"
                                >
                                    {loading ? 'Importing...' : 'Confirm Import'}
                                </button>
                            </div>
                        </div>

                        {/* Manual department selection hidden as it's locked to currentDept */}
                        <input type="hidden" value={departmentId} />

                        <div className="overflow-auto max-h-[500px] border rounded">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                                    <tr>
                                        {extractedData.length > 0 && Object.keys(extractedData[0]).slice(0, 6).map(key => (
                                            <th key={key} className="p-3 border-b">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {extractedData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 border-b last:border-0">
                                            {Object.values(row).slice(0, 6).map((val, vIdx) => (
                                                <td key={vIdx} className="p-3 truncate max-w-xs">{String(val)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-20 text-green-600">
                        <span className="text-5xl mb-4">✅</span>
                        <h3 className="text-2xl font-bold">Import Successful!</h3>
                        <p className="text-gray-600 mt-2">Data has been added to the database.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
