// src/pages/GruposPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
    fetchGrupos, createGrupo, updateGrupo, deleteGrupo,
    selectGrupos, selectGruposLoading, selectGruposError, selectGruposMeta,
    selectGruposSaving, selectGruposSaveError, selectGruposDeleteError,
    clearGruposSaveError, clearGruposDeleteError
} from '../../store/slices/gruposSlice.js';

// Para selects: puedes reemplazar por llamadas reales a /materias y /periodos si quieres
import { fetchMaterias, selectMaterias } from '../../store/slices/materiasSlice.js';
import { fetchPeriodos, selectPeriodos } from '../../store/slices/periodosSlice.js';

function GruposPage() {
    const dispatch = useDispatch();
    const toast = useToast();

    const items = useSelector(selectGrupos);
    const loading = useSelector(selectGruposLoading);
    const error = useSelector(selectGruposError);
    const meta = useSelector(selectGruposMeta);
    const saving = useSelector(selectGruposSaving);
    const saveError = useSelector(selectGruposSaveError);
    const deleteError = useSelector(selectGruposDeleteError);

    const materias = useSelector(selectMaterias);
    const periodos = useSelector(selectPeriodos);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, row: null });
    const [editing, setEditing] = useState(null);

    // Backend: create => { materia_id, periodo_id, codigo, cantidad_maxima }
    const [form, setForm] = useState({ materia_id: '', periodo_id: '', codigo: '', cantidad_maxima: 1 });

    useEffect(() => { dispatch(fetchGrupos({ page })); }, [dispatch, page]);
    // Asegurar catÃ¡logos para selects
    useEffect(() => {
        if (!materias?.length) dispatch(fetchMaterias({ page: 1 }));
        if (!periodos?.length) dispatch(fetchPeriodos({ page: 1 }));
    }, [dispatch]);

    useEffect(() => { if (saveError?.message) toast.push(saveError.message, saveError?.status === 409 ? 'error' : 'error'); }, [saveError, toast]);
    useEffect(() => {
        if (deleteError?.message) { toast.push(deleteError.message, 'error'); dispatch(clearGruposDeleteError()); }
    }, [deleteError, dispatch, toast]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((it) => JSON.stringify(it).toLowerCase().includes(s));
    }, [q, items]);

    const openCreate = () => {
        setEditing(null);
        setForm({ materia_id: '', periodo_id: '', codigo: '', cantidad_maxima: 1 });
        dispatch(clearGruposSaveError());
        setOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            materia_id: row?.materia_id ?? row?.materia?.id ?? '',
            periodo_id: row?.periodo_academico_id ?? row?.periodo?.id ?? '',
            codigo: row?.codigo_grupo ?? '',
            cantidad_maxima: row?.cupo_maximo ?? 1,
        });
        dispatch(clearGruposSaveError());
        setOpen(true);
    };

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        if (!form.materia_id || !form.periodo_id || !form.codigo.trim()) {
            toast.push('Materia, perÃ­odo y cÃ³digo son obligatorios', 'error');
            return;
        }
        try {
            if (editing) {
                await dispatch(updateGrupo({ id: editing.id, codigo: form.codigo, cantidad_maxima: form.cantidad_maxima })).unwrap();
                toast.push('Grupo actualizado', 'success');
            } else {
                await dispatch(createGrupo(form)).unwrap();
                toast.push('Grupo creado', 'success');
            }
            setOpen(false);
            dispatch(fetchGrupos({ page }));
        } catch { }
    };

    const onDelete = async (row) => {
        if (!confirm(`Â¿Eliminar el grupo "${row?.codigo_grupo ?? row.id}"?`)) return;
        try {
            await dispatch(deleteGrupo(row.id)).unwrap();
            toast.push('Grupo eliminado', 'success');
            dispatch(fetchGrupos({ page }));
        } catch { }
    };

    const Paginador = () => (
        <div className="flex items-center justify-between mt-4 text-sm">
            <div>Mostrando {filtered.length} / {meta.total} (pÃ¡gina {meta.current_page} de {meta.last_page})</div>
            <div className="space-x-2">
                <button className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => setPage(1)}>Â« Primera</button>
                <button className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>â€¹ Anterior</button>
                <button className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}>Siguiente â€º</button>
                <button className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.last_page)}>Ãšltima Â»</button>
            </div>
        </div>
    );

    const Errors = ({ errors }) => {
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
            <PageHeader title="Grupos" subtitle="Gestión de grupos por materia y período">
                <button className="btn-primary" onClick={openCreate}>+ Nuevo Grupo</button>
            </PageHeader>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">ðŸ‘¥ Grupos</h1>
                <button className="btn-primary" onClick={openCreate}>+ Nuevo Grupo</button>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <input className="input max-w-sm" placeholder="Buscarâ€¦" value={q} onChange={(e) => setQ(e.target.value)} />
                    <span className="text-sm text-gray-500">PaginaciÃ³n del servidor</span>
                </div>

                {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded mt-4">{error}</div>}

                {loading ? (
                    <div className="py-10 text-center"><Loader />€¦</div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center"><EmptyState title="Aún no hay grupos" message="Crea un grupo para comenzar" /></div>
                ) : (
                    <div className="mt-4 divide-y rounded border bg-white">
                        <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold text-gray-600">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-3">CÃ³digo</div>
                            <div className="col-span-4">Materia</div>
                            <div className="col-span-2">PerÃ­odo</div>
                            <div className="col-span-2 text-right">Acciones</div>
                        </div>
                        {filtered.map((it) => (
                            <div key={it.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm">
                                <div className="col-span-1">#{it.id}</div>
                                <div className="col-span-3">{it.codigo_grupo ?? 'â€”'}</div>
                                <div className="col-span-4 truncate">{it?.materia?.nombre ?? 'â€”'}</div>
                                <div className="col-span-2">{it?.periodo?.nombre ?? 'â€”'}</div>
                                <div className="col-span-2 text-right space-x-2">
                                    <button className="btn-secondary" onClick={() => openEdit(it)}>Editar</button>
                                    <button className="btn-danger" onClick={() => onAskDelete(it)}>Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Paginador />
            </div>

            <Modal
                open={open}
                title={editing ? 'Editar Grupo' : 'Nuevo Grupo'}
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={onSubmit} disabled={saving}>{saving ? 'Guardandoâ€¦' : 'Guardar'}</button>
                    </>
                }
            >
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
                            <select className="input" value={form.materia_id} onChange={(e) => setForm((f) => ({ ...f, materia_id: Number(e.target.value || 0) }))} required>
                                <option value="">â€” Seleccione â€”</option>
                                {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PerÃ­odo *</label>
                            <select className="input" value={form.periodo_id} onChange={(e) => setForm((f) => ({ ...f, periodo_id: Number(e.target.value || 0) }))} required>
                                <option value="">â€” Seleccione â€”</option>
                                {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CÃ³digo *</label>
                            <input className="input" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cupo mÃ¡ximo *</label>
                            <input type="number" min={1} max={100} className="input" value={form.cantidad_maxima} onChange={(e) => setForm((f) => ({ ...f, cantidad_maxima: Number(e.target.value || 1) }))} required />
                        </div>
                    </div>

                    {saveError?.errors && <Errors errors={saveError.errors} />}
                </form>
            </Modal>

            <ConfirmDialog
                open={confirm.open}
                title="Eliminar grupo"
                message={`¿Seguro que deseas eliminar "${confirm.row?.codigo_grupo ?? confirm.row?.id}"?`}
                onCancel={() => setConfirm({ open: false, row: null })}
                onConfirm={onDelete}
                loading={saving}
            />
        </div>
    );
}

export default GruposPage;



