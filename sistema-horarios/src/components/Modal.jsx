// src/components/Modal.jsx
import React from 'react';

export default function Modal({ open, title = '', onClose, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-50 w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button className="text-gray-500 hover:text-gray-800" onClick={onClose}>✕</button>
                </div>
                <div className="mt-3">{children}</div>
                {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
            </div>
        </div>
    );
}