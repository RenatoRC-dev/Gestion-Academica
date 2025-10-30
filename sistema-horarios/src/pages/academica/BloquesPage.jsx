// src/pages/BloquesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBloques,
    selectBloques,
    selectBloquesLoading,
    selectBloquesError,
    selectBloquesMeta,
} from '../../store/slices/bloquesSlice.js';

function BloquesPage() {
    const dispatch = useDispatch();
    const items = useSelector(selectBloques);
    const loading = useSelector(selectBloquesLoading);
    const error = useSelector(selectBloquesError);
    const meta = useSelector(selectBloquesMeta);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');

    useEffect(() => {
        dispatch(fetchBloques({ page }));
    }, [dispatch, page]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((it) => JSON.stringify(it).toLowerCase().includes(s));
    }, [q, items]);

    const etiqueta = (b) => {
        // Tolerante a distintas formas según tu backend:
        const numero = b?.numero ?? b?.id ?? '—';
        const dia = b?.dia?.nombre ?? b?.dia_semana ?? b?.diaNombre ?? 'Día';
        const hi = b?.horario?.hora_inicio ?? b?.hora_inicio ?? '—';
        const hf = b?.horario?.hora_fin ?? b?.hora_fin ?? '—';
        return `#${numero} • ${dia} ${hi}-${hf}`;
    };

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
            <h1 className="text-3xl font-bold text-gray-900">⏰ Bloques Horarios</h1>

            <div className="card">
                <div className="flex items-center justify-between">
                    <input
                        type="text"
                        className="input max-w-sm"
                        placeholder="Buscar bloque..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <span className="text-sm text-gray-500">Servidor: paginación 15 por página</span>
                </div>

                {error && <div className="bg-red-50 p-3 rounded text-sm text-red-700 mt-4">{error}</div>}

                {loading ? (
                    <div className="py-10 text-center">Cargando…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-gray-600">No hay registros</div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {filtered.map((it) => (
                            <div key={it.id ?? it.numero} className="p-3 border rounded bg-white">
                                {etiqueta(it)}
                            </div>
                        ))}
                    </div>
                )}

                <Paginador />
            </div>
        </div>
    );
}

export default BloquesPage;
