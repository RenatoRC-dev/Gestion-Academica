// src/pages/MateriasPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
    fetchMaterias,
    createMateria,
    updateMateria,
    deleteMateria,
    selectMaterias,
    selectMateriasLoading,
    selectMateriasError,
    selectMateriasMeta,
    selectMateriasSaving,
    selectMateriasSaveError,
    selectMateriasDeleteError,
    clearMateriasSaveError,
    clearMateriasDeleteError,
} from '../../store/slices/materiasSlice.js';

function MateriasPage() {
    const dispatch = useDispatch();
    const toast = useToast();

    const items = useSelector(selectMaterias);
    const loading = useSelector(selectMateriasLoading);
    const error = useSelector(selectMateriasError);
    const meta = useSelector(selectMateriasMeta);
    const saving = useSelector(selectMateriasSaving);
    const saveError = useSelector(selectMateriasSaveError);
    const deleteError = useSelector(selectMateriasDeleteError);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');

    const [openForm, setOpenForm] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, row: null });
    const [editing, setEditing] = useState(null);
    // Campos que el backend espera: codigo, nombre, creditos, horas_teoricas
    const [form, setForm] = useState({ codigo: '', nombre: '', creditos: 1, horas_teoricas: 0 });

    useEffect(() => {
        dispatch(fetchMaterias({ page }));
    }, [dispatch, page]);

    useEffect(() => {
        if (saveError?.message) toast.push(saveError.message, 'error');
    }, [saveError, toast]);

    useEffect(() => {
        if (deleteError?.message) {
            toast.push(deleteError.message, 'error'); // p.ej., 422 por grupos activos
            dispatch(clearMateriasDeleteError());
        }
    }, [deleteError, dispatch, toast]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((it) => JSON.stringify(it).toLowerCase().includes(s));
    }, [q, items]);

    const openCreate = () => {
        setEditing(null);
        setForm({ codigo: '', nombre: '', creditos: 1, horas_teoricas: 0 });
        dispatch(clearMateriasSaveError());
        setOpenForm(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            // del backend nos llega codigo_materia; mapeamos al input "codigo"
            codigo: row?.codigo_materia ?? '',
            nombre: row?.nombre ?? '',
            creditos: row?.creditos ?? 1,
            horas_teoricas: row?.horas_teoricas ?? 0,
        });
        dispatch(clearMateriasSaveError());
        setOpenForm(true);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre.trim() || !form.codigo.trim()) {
            toast.push('Nombre y código son obligatorios', 'error');
            return;
        }
        try {
            if (editing) {
                await dispatch(updateMateria({ id: editing.id, ...form })).unwrap();
                toast.push('Materia actualizada', 'success');
            } else {
                await dispatch(createMateria(form)).unwrap();
                toast.push('Materia creada', 'success');
            }
            setOpenForm(false);
            dispatch(fetchMaterias({ page }));
        } catch {
            // errores ya se muestran por saveError
        }
    };

    const onDelete = async (row) => {
        if (!confirm(`¿Eliminar la materia "${row?.nombre ?? row?.codigo_materia ?? row.id}"?`)) return;
        try {
            await dispatch(deleteMateria(row.id)).unwrap();
            toast.push('Materia eliminada', 'success');
            dispatch(fetchMaterias({ page }));
        } catch {
            // deleteError ya lo maneja el effect
        }
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
                    <div key={field}>
                        <strong>{field}:</strong> {Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">📚 Materias</h1>
                <button className="btn-primary" onClick={openCreate}>+ Nueva Materia</button>
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
                    <div className="py-10 text-center"><EmptyState title="Aún no hay materias" message="Crea la primera materia para comenzar" /></div>
                ) : (
                    <div className="mt-4 divide-y rounded border bg-white">
                        <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold text-gray-600">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-3">Nombre</div>
                            <div className="col-span-3">Código</div>
                            <div className="col-span-2">Créditos</div>
                            <div className="col-span-1">Horas T.</div>
                            <div className="col-span-2 text-right">Acciones</div>
                        </div>
                        {filtered.map((it) => (
                            <div key={it.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm">
                                <div className="col-span-1">#{it.id}</div>
                                <div className="col-span-3">{it.nombre ?? '—'}</div>
                                <div className="col-span-3">{it.codigo_materia ?? '—'}</div>
                                <div className="col-span-2">{it.creditos ?? '—'}</div>
                                <div className="col-span-1">{it.horas_teoricas ?? 0}</div>
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
                open={openForm}
                title={editing ? 'Editar Materia' : 'Nueva Materia'}
                onClose={() => setOpenForm(false)}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setOpenForm(false)} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={onSubmit} disabled={saving}>
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </>
                }
            >
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                            <input
                                className="input"
                                value={form.codigo}
                                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                                placeholder="p.ej. INF-101"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                                className="input"
                                value={form.nombre}
                                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                                placeholder="p.ej. Introducción a la Informática"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Créditos *</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                className="input"
                                value={form.creditos}
                                onChange={(e) => setForm((f) => ({ ...f, creditos: Number(e.target.value || 1) }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Horas teóricas</label>
                            <input
                                type="number"
                                min={0}
                                className="input"
                                value={form.horas_teoricas}
                                onChange={(e) => setForm((f) => ({ ...f, horas_teoricas: Number(e.target.value || 0) }))}
                            />
                        </div>
                    </div>

                    {/* Mensajes de validación del backend (422) */}
                    <Errors422 errors={saveError?.errors} />
                </form>
            </Modal>
        </div>
    );
}

export default MateriasPage;

