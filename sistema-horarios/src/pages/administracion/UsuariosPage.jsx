// src/pages/UsuariosPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import {
    fetchUsuarios, createUsuario, updateUsuario, deleteUsuario,
    selectUsuarios, selectUsuariosLoading, selectUsuariosError, selectUsuariosMeta,
    selectUsuariosSaving, selectUsuariosSaveError, selectUsuariosDeleting, selectUsuariosDeleteError,
    selectUsuariosPasswordTemp, clearUsuariosSaveError, clearUsuariosDeleteError, clearUsuariosPasswordTemp
} from '../../store/slices/usuariosSlice.js';
import UserRolesPanel from '../../components/UserRolesPanel.jsx';

export default function UsuariosPage() {
    const dispatch = useDispatch();
    const toast = useToast();

    const items = useSelector(selectUsuarios);
    const loading = useSelector(selectUsuariosLoading);
    const error = useSelector(selectUsuariosError);
    const meta = useSelector(selectUsuariosMeta);
    const saving = useSelector(selectUsuariosSaving);
    const saveError = useSelector(selectUsuariosSaveError);
    const deleting = useSelector(selectUsuariosDeleting);
    const deleteError = useSelector(selectUsuariosDeleteError);
    const passwordTemp = useSelector(selectUsuariosPasswordTemp);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [rolesOpen, setRolesOpen] = useState(false);
    const [targetUser, setTargetUser] = useState(null);

    const [form, setForm] = useState({ nombre_completo: '', email: '', activo: true });

    useEffect(() => { dispatch(fetchUsuarios({ page })); }, [dispatch, page]);

    useEffect(() => { if (saveError?.message) toast.push(saveError.message, 'error'); }, [saveError, toast]);
    useEffect(() => {
        if (deleteError?.message) { toast.push(deleteError.message, 'error'); dispatch(clearUsuariosDeleteError()); }
    }, [deleteError, dispatch, toast]);

    useEffect(() => {
        if (passwordTemp) {
            toast.push(`Usuario creado. Password temporal: ${passwordTemp}`, 'success');
            dispatch(clearUsuariosPasswordTemp());
        }
    }, [passwordTemp, dispatch, toast]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((it) => JSON.stringify(it).toLowerCase().includes(s));
    }, [q, items]);

    const openCreate = () => {
        setEditing(null);
        setForm({ nombre_completo: '', email: '', activo: true });
        dispatch(clearUsuariosSaveError());
        setOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            nombre_completo: row?.nombre_completo ?? '',
            email: row?.email ?? '',
            activo: !!row?.activo
        });
        dispatch(clearUsuariosSaveError());
        setOpen(true);
    };

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        if (!form.nombre_completo.trim() || !form.email.trim()) {
            toast.push('Nombre y email son obligatorios', 'error');
            return;
        }
        try {
            if (editing) {
                await dispatch(updateUsuario({ id: editing.id, ...form })).unwrap();
                toast.push('Usuario actualizado', 'success');
            } else {
                await dispatch(createUsuario(form)).unwrap();
                // toast del password temporal se muestra en effect
            }
            setOpen(false);
            dispatch(fetchUsuarios({ page }));
        } catch { }
    };

    const onDelete = async (row) => {
        if (!confirm(`¿Eliminar el usuario "${row?.nombre_completo ?? row?.email ?? row.id}"?`)) return;
        try {
            await dispatch(deleteUsuario(row.id)).unwrap();
            toast.push('Usuario eliminado', 'success');
            dispatch(fetchUsuarios({ page }));
        } catch { }
    };

    const onManageRoles = (row) => {
        setTargetUser(row);
        setRolesOpen(true);
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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">👤 Usuarios</h1>
                <button className="btn-primary" onClick={openCreate}>+ Nuevo Usuario</button>
            </div>

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
                    <div className="mt-4 divide-y rounded border bg-white">
                        <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold text-gray-600">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-3">Nombre</div>
                            <div className="col-span-3">Email</div>
                            <div className="col-span-3">Roles</div>
                            <div className="col-span-2 text-right">Acciones</div>
                        </div>
                        {filtered.map((it) => (
                            <div key={it.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm">
                                <div className="col-span-1">#{it.id}</div>
                                <div className="col-span-3">{it.nombre_completo ?? '—'}</div>
                                <div className="col-span-3">{it.email ?? '—'}</div>
                                <div className="col-span-3 truncate">{Array.isArray(it.roles) ? it.roles.map(r => r.nombre).join(', ') : '—'}</div>
                                <div className="col-span-2 text-right space-x-2">
                                    <button className="btn-secondary" onClick={() => onManageRoles(it)}>Roles</button>
                                    <button className="btn-secondary" onClick={() => openEdit(it)}>Editar</button>
                                    <button className="btn-danger" disabled={deleting} onClick={() => onDelete(it)}>Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Paginador />
            </div>

            {/* Modal crear/editar */}
            <Modal
                open={open}
                title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={onSubmit} disabled={saving}>
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </>
                }
            >
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                            <input className="input" value={form.nombre_completo} onChange={(e) => setForm((f) => ({ ...f, nombre_completo: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Activo</label>
                        <input type="checkbox" checked={!!form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />
                    </div>
                    {saveError?.errors && (
                        <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded">
                            {Object.entries(saveError.errors).map(([k, v]) => (<div key={k}><strong>{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}</div>))}
                        </div>
                    )}
                </form>
            </Modal>

            {/* Panel roles por usuario */}
            {rolesOpen && targetUser && (
                <UserRolesPanel open={rolesOpen} onClose={() => setRolesOpen(false)} user={targetUser} />
            )}
        </div>
    );
}
