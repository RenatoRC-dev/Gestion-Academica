// src/components/ConflictosList.jsx
import React from 'react';

export default function ConflictosList({ conflictos = [] }) {
    if (!Array.isArray(conflictos) || conflictos.length === 0) return null;
    return (
        <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded">
            <div className="font-semibold mb-1">Conflictos detectados</div>
            <ul className="list-disc pl-6 space-y-1">
                {conflictos.map((c, i) => (
                    <li key={i}>
                        {c.tipo ? <b>{c.tipo}: </b> : null}
                        {c.descripcion || c.mensaje || c.detalle || JSON.stringify(c)}
                    </li>
                ))}
            </ul>
        </div>
    );
}