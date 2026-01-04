import React from 'react';
import { Link } from 'react-router-dom';

export default function ResultNotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col p-6">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-gray-300">404</h1>
                <h2 className="text-4xl font-bold text-gray-800 mt-4">Page Not Found</h2>
                <p className="text-gray-600 mt-2 mb-8">
                    Oops! The page you are looking for does not exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
