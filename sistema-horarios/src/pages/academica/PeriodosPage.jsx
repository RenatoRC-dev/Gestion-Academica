import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import {
    fetchPeriodos,
    createPeriodo,
    updatePeriodo,
    deletePeriodo
} from '../../store/slices/periodosSlice.js';

export default function PeriodosPage() {
    const dispatch = useDispatch();
    const toast = useToast();
    const { items, pagination, loading, creating, updating, deleting, error } = useSelector(s => s.periodos);

    const [openForm, setOpenForm] = useState(false);
    const [form, setForm] = useState({
        id: null,
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: true
    });

    const isEditing = form.id !== null;

    useEffect(() => {
        dispatch(fetchPeriodos({ page: 1 }));
    }, [dispatch]);

    const resetForm = () => {
        setForm({ id: null, nombre: '', fecha_inicio: '', fecha_fin: '', activo: true });
        setOpenForm(false);
    };

    const openCreate = () => {
        setForm({ id: null, nombre: '', fecha_inicio: '', fecha_fin: '', activo: true });
        setOpenForm(true);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre?.trim()) {
            toast.push('Nombre requerido', 'error');
            return;
        }
        if (!form.fecha_inicio || !form.fecha_fin) {
            toast.push('Fechas requeridas', 'error');
            return;
        }
        const ini = new Date(form.fecha_inicio);
        const fin = new Date(form.fecha_fin);
        if (isFinite(ini) && isFinite(fin) && fin < ini) {
            toast.push('La fecha fin debe ser mayor a la fecha de inicio', 'error');
            return;
        }

        const payload = {
            nombre: form.nombre.trim(),
            fecha_inicio: form.fecha_inicio,
            fecha_fin: form.fecha_fin,
            activo: !!form.activo
        };

        try {
            if (isEditing) {
                const res = await dispatch(updatePeriodo({ id: form.id, changes: payload }));
                if (!res.error) {
                    toast.push('Período actualizado', 'success');
                    resetForm();
                }
            } else {
                const res = await dispatch(createPeriodo(payload));
                if (!res.error) {
                    toast.push('Período creado', 'success');
                    resetForm();
                }
            }
        } catch (err) {
            toast.push('Error al guardar el período', 'error');
        }
    };

    const onEdit = (p) => {
        setForm({
            id: p.id,
            nombre: p.nombre || '',
            fecha_inicio: (p.fecha_inicio || '').slice(0, 10),
            fecha_fin: (p.fecha_fin || '').slice(0, 10),
            activo: !!p.activo
        });
        setOpenForm(true);
    };

    const onDelete = async (id) => {
        if (confirm('¿Eliminar período? Esta acción es irreversible.')) {
            const res = await dispatch(deletePeriodo(id));
            if (!res.error) {
                toast.push('Período eliminado', 'success');
            }
        }
    };

    const goPage = (page) => dispatch(fetchPeriodos({ page }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">📅 Períodos Académicos</h1>
                    <p className="mt-1 text-sm text-gray-500">Gestión de períodos y ciclos académicos</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Nuevo Período</button>
            </div>

            <div className="card">
                {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-4">{error}</div>}

                {loading ? (
                    <div className="py-10 text-center"><Loader /></div>
                ) : items.length === 0 ? (
                    <div className="py-10 text-center"><EmptyState title="Aún no hay períodos" message="Crea el primer período para comenzar" /></div>
                ) : (
                    <div className="mt-4 divide-y rounded border bg-white">
                        <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold text-gray-600">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-3">Nombre</div>
                            <div className="col-span-2">Inicio</div>
                            <div className="col-span-2">Fin</div>
                            <div className="col-span-2">Activo</div>
                            <div className="col-span-2 text-right">Acciones</div>
                        </div>
                        {items.map((p) => (
                            <div key={p.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm">
                                <div className="col-span-1">#{p.id}</div>
                                <div className="col-span-3">{p.nombre}</div>
                                <div className="col-span-2">{(p.fecha_inicio || '').slice(0, 10)}</div>
                                <div className="col-span-2">{(p.fecha_fin || '').slice(0, 10)}</div>
                                <div className="col-span-2">
                                    {p.activo ? (
                                        <span className="text-green-600 font-medium">Sí</span>
                                    ) : (
                                        <span className="text-gray-400">No</span>
                                    )}
                                </div>
                                <div className="col-span-2 text-right space-x-2">
                                    <button className="btn-secondary" onClick={() => onEdit(p)}>Editar</button>
                                    <button className="btn-danger" disabled={deleting} onClick={() => onDelete(p.id)}>Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4 text-sm">
                    <div>Mostrando {items.length} (página {pagination.current_page} de {pagination.last_page})</div>
                    <div className="space-x-2">
                        <button className="btn-secondary" disabled={pagination.current_page <= 1 || loading} onClick={() => goPage(1)}>« Primera</button>
                        <button className="btn-secondary" disabled={pagination.current_page <= 1 || loading} onClick={() => goPage(pagination.current_page - 1)}>‹ Anterior</button>
                        <button className="btn-secondary" disabled={pagination.current_page >= pagination.last_page || loading} onClick={() => goPage(pagination.current_page + 1)}>Siguiente ›</button>
                        <button className="btn-secondary" disabled={pagination.current_page >= pagination.last_page || loading} onClick={() => goPage(pagination.last_page)}>Última »</button>
                    </div>
                </div>
            </div>

            <Modal
                open={openForm}
                title={isEditing ? 'Editar Período' : 'Nuevo Período'}
                onClose={() => setOpenForm(false)}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setOpenForm(false)} disabled={creating || updating}>Cancelar</button>
                        <button className="btn-primary" onClick={onSubmit} disabled={creating || updating}>
                            {creating || updating ? 'Guardando…' : 'Guardar'}
                        </button>
                    </>
                }
            >
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                                className="input"
                                type="text"
                                value={form.nombre}
                                onChange={e => setForm({ ...form, nombre: e.target.value })}
                                placeholder="Gestión 2025/1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Activo</label>
                            <div className="flex items-center h-10">
                                <input
                                    type="checkbox"
                                    checked={form.activo}
                                    onChange={e => setForm({ ...form, activo: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">Período activo</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
                            <input
                                className="input"
                                type="date"
                                value={form.fecha_inicio}
                                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
                            <input
                                className="input"
                                type="date"
                                value={form.fecha_fin}
                                onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
