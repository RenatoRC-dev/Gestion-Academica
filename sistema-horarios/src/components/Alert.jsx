// src/components/Alert.jsx
import React from 'react';

export default function Alert({
  type = 'info',
  kind,
  title,
  message,
  children,
  onClose,
  className = '',
}) {
  const tone = kind || type || 'info';
  const palette = {
    info: { wrap: 'bg-blue-50 text-blue-800', border: 'border-blue-200' },
    warn: { wrap: 'bg-yellow-50 text-yellow-800', border: 'border-yellow-200' },
    warning: { wrap: 'bg-yellow-50 text-yellow-800', border: 'border-yellow-200' },
    error: { wrap: 'bg-red-50 text-red-700', border: 'border-red-200' },
    success: { wrap: 'bg-green-50 text-green-700', border: 'border-green-200' },
  };
  const colors = palette[tone] || palette.info;
  const body = message ?? children;

  return (
    <div className={`rounded border p-3 text-sm flex justify-between gap-4 ${colors.wrap} ${colors.border} ${className}`}>
      <div>
        {title && <div className="font-semibold mb-1">{title}</div>}
        {body}
      </div>
      {onClose && (
        <button type="button" className="alert-close" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}
