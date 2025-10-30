// src/components/FormField.jsx
import React from 'react';

export default function FormField({ label, required, type = 'text', value, onChange, placeholder, min, max }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            <input
                className="input"
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                min={min}
                max={max}
                required={required}
            />
        </div>
    );
}