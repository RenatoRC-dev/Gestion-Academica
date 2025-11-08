// src/pages/AulasPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
    fetchAulas, createAula, updateAula, deleteAula,
    selectAulas, selectAulasLoading, selectAulasError, selectAulasMeta,
    selectAulasSaving, selectAulasSaveError, selectAulasDeleteError,
    clearAulasSaveError, clearAulasDeleteError
} from '../../store/slices/aulasSlice.js';

function AulasPage() {
    const dispatch = useDispatch();
    const toast = useToast();
    const items = useSelector(selectAulas);
    const loading = useSelector(selectAulasLoading);
    const error = useSelector(selectAulasError);
    const meta = useSelector(selectAulasMeta);
    const saving = useSelector(selectAulasSaving);
    const saveError = useSelector(selectAulasSaveError);
    const deleteError = useSelector(selectAulasDeleteError);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, row: null });
    const [editing, setEditing] = useState(null);
    // Backend usa nombre (que mapea a codigo_aula), capacidad, ubicacion?, piso?
    const [form, setForm] = useState({ nombre: '', capacidad: 1, ubicacion: '', piso: 1 });

    useEffect(() => { dispatch(fetchAulas({ page })); }, [dispatch, page]);

    useEffect(() => { if (saveError?.message) toast.push(saveError.message, 'error'); }, [saveError, toast]);
    useEffect(() => {
        if (deleteError?.message) { toast.push(deleteError.message, 'error'); dispatch(clearAulasDeleteError()); }
    }, [deleteError, dispatch, toast]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((it) => JSON.stringify(it).toLowerCase().includes(s));
    }, [q, items]);

    const openCreate = () => {
        setEditing(null);
        setForm({ nombre: '', capacidad: 1, ubicacion: '', piso: 1 });
        dispatch(clearAulasSaveError());
        setOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            nombre: row?.codigo_aula ?? '',
            capacidad: row?.capacidad ?? 1,
            ubicacion: row?.ubicacion ?? '',
            piso: row?.piso ?? 1,
        });
        dispatch(clearAulasSaveError());
        setOpen(true);
    };

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        if (!form.nombre.trim()) { toast.push('El nombre/código es obligatorio', 'error'); return; }
        try {
            if (editing) {
                await dispatch(updateAula({ id: editing.id, ...form })).unwrap();
                toast.push('Aula actualizada', 'success');
            } else {
                await dispatch(createAula(form)).unwrap();
                toast.push('Aula creada', 'success');
            }
            setOpen(false);
            dispatch(fetchAulas({ page }));
        } catch { }
    };

    const onDelete = async (row) => {
        if (!confirm(`¿Eliminar el aula "${row?.codigo_aula ?? row.id}"?`)) return;
        try {
            await dispatch(deleteAula(row.id)).unwrap();
            toast.push('Aula eliminada', 'success');
            dispatch(fetchAulas({ page }));
        } catch { }
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

    const Errors422 = ({ errors }) => {
        if (!errors) return null;
        const entries = Object.entries(errors);
        if (!entries.length) return null;
        return (
            <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded">
                {entries.map(([field, msgs]) => (
                    <div key={field}><strong>{field}:</strong> {Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}</div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">🏫 Aulas</h1>
                    <p className="mt-1 text-sm text-gray-500">Gestión de aulas y espacios físicos</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Nueva Aula</button>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <input className="input max-w-sm" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
                    <span className="text-sm text-gray-500">Paginación del servidor</span>
                </div>

                {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded mt-4">{error}</div>}

                {loading ? (
                    <div className="py-10 text-center"><Loader /></div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center"><EmptyState title="Aún no hay aulas" message="Crea la primera aula para comenzar" /></div>
                ) : (
                    <div className="mt-4 divide-y rounded border bg-white">
                        <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold text-gray-600">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-3">Código</div>
                            <div className="col-span-2">Capacidad</div>
                            <div className="col-span-4">Ubicación</div>
                            <div className="col-span-2 text-right">Acciones</div>
                        </div>
                        {filtered.map((it) => (
                            <div key={it.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm">
                                <div className="col-span-1">#{it.id}</div>
                                <div className="col-span-3">{it.codigo_aula ?? '—'}</div>
                                <div className="col-span-2">{it.capacidad ?? '—'}</div>
                                <div className="col-span-4 truncate">{it.ubicacion ?? '—'}</div>
                                <div className="col-span-2 text-right space-x-2">
                                    <button className="btn-secondary" onClick={() => openEdit(it)}>Editar</button>
                                    <button className="btn-danger" onClick={() => onDelete(it)}>Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Paginador />
            </div>

            <Modal
                open={open}
                title={editing ? 'Editar Aula' : 'Nueva Aula'}
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={onSubmit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
                    </>
                }
            >
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                            <input className="input" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="p.ej. A-101" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad *</label>
                            <input type="number" min={1} max={200} className="input" value={form.capacidad} onChange={(e) => setForm((f) => ({ ...f, capacidad: Number(e.target.value || 1) }))} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                            <input className="input" value={form.ubicacion} onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
                            <input type="number" min={0} className="input" value={form.piso} onChange={(e) => setForm((f) => ({ ...f, piso: Number(e.target.value || 1) }))} />
                        </div>
                    </div>

                    {/* Mensajes de validación del backend (422) */}
                    <Errors422 errors={saveError?.errors} />
                </form>
            </Modal>
        </div>
    );
}

export default AulasPage;
