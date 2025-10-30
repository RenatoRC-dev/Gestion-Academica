// src/components/Alert.jsx
import React from 'react';

export default function Alert({ kind = 'info', title, children, className = '' }) {
    const map = {
        info: { wrap: 'bg-blue-50 text-blue-800', border: 'border-blue-200' },
        warn: { wrap: 'bg-yellow-50 text-yellow-800', border: 'border-yellow-200' },
        error: { wrap: 'bg-red-50 text-red-700', border: 'border-red-200' },
        success: { wrap: 'bg-green-50 text-green-700', border: 'border-green-200' },
    };
    const c = map[kind] || map.info;
    return (
        <div className={`rounded border p-3 text-sm ${c.wrap} ${c.border} ${className}`}>
            {title && <div className="font-semibold mb-1">{title}</div>}
            {children}
        </div>
    );
}