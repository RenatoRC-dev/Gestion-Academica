// src/components/FieldErrorList.jsx
import React from 'react';

export default function FieldErrorList({ errors }) {
    if (!errors) return null;
    const entries = Object.entries(errors);
    if (!entries.length) return null;
    return (
        <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded">
            {entries.map(([field, msgs]) => (
                <div key={field}>
                    <strong>{field}:</strong> {Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}
                </div>
            ))}
        </div>
    );
}