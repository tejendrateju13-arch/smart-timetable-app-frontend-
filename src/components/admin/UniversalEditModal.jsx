import React, { useState, useEffect } from 'react';

/**
 * UniversalEditModal component
 * @param {boolean} isOpen - Control visibility
 * @param {function} onClose - Handle close
 * @param {object} item - The current item being edited
 * @param {function} onSave - Handle save (API call)
 * @param {string} title - Modal title
 * @param {array} fields - List of fields [{name, label, type, options}]
 */
export default function UniversalEditModal({ isOpen, onClose, item, onSave, title, fields }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) setFormData(item);
        else setFormData({});
    }, [item]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save changes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fields.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={formData[field.name] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    required
                                >
                                    <option value="">Select Option</option>
                                    {field.options.map(opt => (
                                        <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
                                    ))}
                                </select>
                            ) : field.type === 'checkbox-group' ? (
                                <div className="flex flex-wrap gap-4 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    {field.options.map(opt => {
                                        const val = opt.value || opt;
                                        const label = opt.label || opt;
                                        const isChecked = (formData[field.name] || []).includes(val);
                                        return (
                                            <label key={val} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const current = formData[field.name] || [];
                                                        const next = e.target.checked
                                                            ? [...current, val]
                                                            : current.filter(v => v !== val);
                                                        setFormData({ ...formData, [field.name]: next });
                                                    }}
                                                />
                                                <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors font-medium">{label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={formData[field.name] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    required={field.required !== false}
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:bg-blue-300"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
