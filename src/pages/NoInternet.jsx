import React from 'react';

export default function NoInternet() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white flex-col p-6">
            <div className="text-center">
                <div className="mb-6">
                    <svg className="w-24 h-24 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mt-4">No Internet Connection</h2>
                <p className="text-gray-600 mt-2 mb-8">
                    Please check your network settings and try again.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-gray-700 transition"
                >
                    Retry Connection
                </button>
            </div>
        </div>
    );
}
