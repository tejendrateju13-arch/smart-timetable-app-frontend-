import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative">
            <button
                className="flex items-center w-full p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <div className="relative">
                    {/* Bell Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <span className="ml-3 font-medium text-gray-700">Notifications</span>
            </button>

            {showDropdown && (
                <div className="mt-2 w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
                        <button onClick={fetchNotifications} className="text-xs text-blue-500 hover:underline">Refresh</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-xs">No notifications</div>
                        ) : (
                            <ul>
                                {notifications.map(n => (
                                    <li
                                        key={n.id}
                                        onClick={() => {
                                            markAsRead(n.id);
                                            if (n.link) window.location.href = n.link;
                                        }}
                                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${n.read ? 'opacity-60' : 'bg-blue-50'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs text-gray-800 font-medium">{n.message}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 block">
                                            {(() => {
                                                const d = n.createdAt || n.timestamp;
                                                const dateObj = d?.toDate ? d.toDate() : new Date(d);
                                                return isNaN(dateObj) ? 'Just now' : dateObj.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
                                            })()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
