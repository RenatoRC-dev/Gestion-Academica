import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchPeriodos,
    createPeriodo,
    updatePeriodo,
    deletePeriodo
} from '../../store/slices/periodosSlice.js';

export default function PeriodosPage() {
    const dispatch = useDispatch();
    const { items, pagination, loading, creating, updating, deleting, error } = useSelector(s => s.periodos);

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

    const resetForm = () => setForm({ id: null, nombre: '', fecha_inicio: '', fecha_fin: '', activo: true });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre?.trim()) return alert('Nombre requerido');
        if (!form.fecha_inicio || !form.fecha_fin) return alert('Fechas requeridas');
        const ini = new Date(form.fecha_inicio);
        const fin = new Date(form.fecha_fin);
        if (isFinite(ini) && isFinite(fin) && fin < ini) return alert('La fecha fin debe ser > inicio');

        const payload = {
            nombre: form.nombre.trim(),
            fecha_inicio: form.fecha_inicio,
            fecha_fin: form.fecha_fin,
            activo: !!form.activo
        };

        if (isEditing) {
            const res = await dispatch(updatePeriodo({ id: form.id, changes: payload }));
            if (!res.error) resetForm();
        } else {
            const res = await dispatch(createPeriodo(payload));
            if (!res.error) resetForm();
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id) => {
        if (confirm('¿Eliminar período? Esta acción es irreversible.')) {
            await dispatch(deletePeriodo(id));
        }
    };

    const goPage = (page) => dispatch(fetchPeriodos({ page }));

    return (
        <div className="container" style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
            <h2 style={{ marginBottom: 8 }}>Períodos Académicos</h2>
            {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}

            {/* Formulario */}
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
                    <label>
                        <div>Nombre *</div>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Gestión 2025/1"
                            required
                        />
                    </label>
                    <label>
                        <div>Activo</div>
                        <input
                            type="checkbox"
                            checked={form.activo}
                            onChange={e => setForm({ ...form, activo: e.target.checked })}
                        />
                    </label>
                </div>

                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
                    <label>
                        <div>Fecha inicio *</div>
                        <input
                            type="date"
                            value={form.fecha_inicio}
                            onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                            required
                        />
                    </label>
                    <label>
                        <div>Fecha fin *</div>
                        <input
                            type="date"
                            value={form.fecha_fin}
                            onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                            required
                        />
                    </label>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={creating || updating}>
                        {isEditing ? 'Actualizar' : 'Crear'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={resetForm}>Cancelar</button>
                    )}
                </div>
            </form>

            {/* Tabla */}
            <div style={{ opacity: loading ? 0.6 : 1 }}>
                <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f3f3f3' }}>
                            <th align="left">#</th>
                            <th align="left">Nombre</th>
                            <th align="left">Inicio</th>
                            <th align="left">Fin</th>
                            <th align="left">Activo</th>
                            <th align="left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p, idx) => (
                            <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                                <td>{idx + 1}</td>
                                <td>{p.nombre}</td>
                                <td>{(p.fecha_inicio || '').slice(0, 10)}</td>
                                <td>{(p.fecha_fin || '').slice(0, 10)}</td>
                                <td>{p.activo ? 'Sí' : 'No'}</td>
                                <td style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => onEdit(p)}>Editar</button>
                                    <button disabled={deleting} onClick={() => onDelete(p.id)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && !loading && (
                            <tr><td colSpan={6} align="center">Sin datos</td></tr>
                        )}
                    </tbody>
                </table>

                {/* Paginación */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button disabled={pagination.current_page <= 1 || loading} onClick={() => goPage(pagination.current_page - 1)}>Anterior</button>
                    <div>Página {pagination.current_page} de {pagination.last_page}</div>
                    <button disabled={pagination.current_page >= pagination.last_page || loading} onClick={() => goPage(pagination.current_page + 1)}>Siguiente</button>
                </div>
            </div>
        </div>
    );
}
