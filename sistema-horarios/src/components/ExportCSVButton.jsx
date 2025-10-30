// src/components/ExportCSVButton.jsx
import React from 'react';

function serializeCSV(rows, headers = null) {
    if (!Array.isArray(rows)) return '';
    const keys = headers || Object.keys(rows[0] || {});
    const esc = (val) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = keys.map(esc).join(',');
    const body = rows.map((r) => keys.map((k) => esc(r?.[k])).join(',')).join('\n');
    return head + '\n' + body;
}

function download(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

export default function ExportCSVButton({ rows, filename = 'export.csv', headers }) {
    const onExport = () => {
        const csv = serializeCSV(rows, headers);
        download(filename, csv);
    };
    return (
        <button className="btn-secondary" onClick={onExport} disabled={!rows || rows.length === 0}>
            ⬇️ Exportar CSV
        </button>
    );
}