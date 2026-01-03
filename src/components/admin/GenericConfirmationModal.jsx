import React from 'react';

/**
 * GenericConfirmationModal
 * A customized replacement for window.confirm
 */
export default function GenericConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${isDangerous ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {isDangerous ? (
                            <span className="text-2xl">⚠</span>
                        ) : (
                            <span className="text-2xl">ℹ</span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>

                    {children && <div className="mb-6 text-left">{children}</div>}

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold shadow-lg transition transform active:scale-95 ${isDangerous ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
