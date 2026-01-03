import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // We need a new endpoint or just query firestore if we had raw access, but let's assume we need an endpoint
            // Fetch from new endpoint
            // Fetch from dedicated notifications endpoint
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">System Notifications</h2>
            {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <p className="text-gray-500">No notifications found.</p>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`p-4 rounded-lg border shadow-sm transition-all ${n.type === 'alert' ? 'bg-red-50 border-red-300 animate-pulse-slow' :
                                n.type === 'system' ? 'bg-purple-50 border-purple-200' :
                                    n.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                                        'bg-white border-gray-100 hover:shadow-md'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div className="w-full">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${n.type === 'alert' ? 'bg-red-600 text-white' :
                                                n.type === 'system' ? 'bg-purple-600 text-white' :
                                                    n.type === 'warning' ? 'bg-orange-500 text-white' :
                                                        'bg-gray-200 text-gray-700'
                                                }`}>
                                                {n.type === 'alert' ? '⚠ ACTION REQUIRED' : n.type}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(n.timestamp || n.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className={`mt-2 font-bold ${n.type === 'alert' ? 'text-red-900 text-lg' : 'text-gray-800'}`}>
                                            {n.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
