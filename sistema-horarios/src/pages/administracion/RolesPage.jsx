// src/pages/RolesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchRoles,
    selectRoles,
    selectRolesLoading,
    selectRolesError,
    selectRolesMeta,
} from '../../store/slices/rolesSlice.js';

function RolesPage() {
    const dispatch = useDispatch();
    const items = useSelector(selectRoles);
    const loading = useSelector(selectRolesLoading);
    const error = useSelector(selectRolesError);
    const meta = useSelector(selectRolesMeta);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');

    useEffect(() => {
        dispatch(fetchRoles({ page }));
    }, [dispatch, page]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((it) => JSON.stringify(it).toLowerCase().includes(s));
    }, [q, items]);

    const etiqueta = (r) => r?.nombre ?? r?.name ?? `Rol #${r?.id ?? '—'}`;

    const Paginador = () => (
        <div className="flex items-center justify-between mt-4 text-sm">
            <div>Mostrando {filtered.length} / {meta.total} (página {meta.current_page} de {meta.last_page})</div>
            <div className="space-x-2">
                <button className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => setPage(1)}>« Primera</button>
                <button className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹ Anterior</button>
                <button className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}>Siguiente ›</button>
                <button className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.last_page)}>Última »</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">🔐 Roles</h1>

            <div className="card">
                <div className="flex items-center justify-between">
                    <input className="input max-w-sm" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
                    <span className="text-sm text-gray-500">Paginación del servidor</span>
                </div>

                {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded mt-4">{error}</div>}

                {loading ? (
                    <div className="py-10 text-center">Cargando…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-gray-600">Sin registros</div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {filtered.map((it) => (
                            <div key={it.id} className="p-3 border rounded bg-white">
                                #{it.id} — {etiqueta(it)}
                            </div>
                        ))}
                    </div>
                )}

                <Paginador />
            </div>
        </div>
    );
}

export default RolesPage;
