// src/pages/BitacoraPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBitacora, selectBitacora, selectBitacoraLoading, selectBitacoraError, selectBitacoraMeta } from '../../store/slices/bitacoraSlice.js';

export default function BitacoraPage() {
    const dispatch = useDispatch();
    const rows = useSelector(selectBitacora);
    const loading = useSelector(selectBitacoraLoading);
    const error = useSelector(selectBitacoraError);
    const meta = useSelector(selectBitacoraMeta);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');

    useEffect(() => { dispatch(fetchBitacora({ page })); }, [dispatch, page]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((it) => JSON.stringify(it).toLowerCase().includes(s));
    }, [q, rows]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">📝 Bitácora</h1>
                <input className="input max-w-sm" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            <div className="card">
                {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded mt-2">{error}</div>}

                {loading ? (
                    <div className="py-10 text-center">Cargando…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-gray-600">Sin registros</div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600">
                                    <th className="text-left p-2">#</th>
                                    <th className="text-left p-2">Acción</th>
                                    <th className="text-left p-2">Modelo</th>
                                    <th className="text-left p-2">Usuario</th>
                                    <th className="text-left p-2">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b, idx) => (
                                    <tr key={b.id} className="border-t">
                                        <td className="p-2">{idx + 1}</td>
                                        <td className="p-2">{b.accion ?? b.action ?? '-'}</td>
                                        <td className="p-2">{b.tabla_afectada ?? b.modelo ?? b.model ?? '-'}</td>
                                        <td className="p-2">{b.usuario?.nombre_completo ?? b.usuario_nombre ?? '-'}</td>
                                        <td className="p-2">{(b.fecha_hora || b.created_at || '').toString().replace('T',' ').slice(0,19)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between mt-4 text-sm">
                            <div>Mostrando {filtered.length} / {meta.total} (página {meta.current_page} de {meta.last_page})</div>
                            <div className="space-x-2">
                                <button className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => setPage(1)}>« Primera</button>
                                <button className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹ Anterior</button>
                                <button className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}>Siguiente ›</button>
                                <button className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.last_page)}>Última »</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
