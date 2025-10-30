// src/components/UserRolesPanel.jsx
import React, { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserRoles, fetchRolesDelUsuario, asignarRol, revocarRol, selectUserRolesSaving } from '../store/slices/userRolesSlice.js';
import api from '../services/api.js';

// Panel lateral/Modal para administrar los roles de un usuario
export default function UserRolesPanel({ open, onClose, user }) {
    const dispatch = useDispatch();
    const rolesDelUsuario = useSelector(selectUserRoles(user.id));
    const saving = useSelector(selectUserRolesSaving);

    const [allRoles, setAllRoles] = useState([]);
    const [rolId, setRolId] = useState('');

    useEffect(() => {
        if (!user?.id) return;
        dispatch(fetchRolesDelUsuario({ usuarioId: user.id }));
        // Cargar catálogo de roles (GET /roles) - apiResource
        api.get('/roles')
            .then(res => {
                const p = res?.data?.data ?? {};
                const rows = Array.isArray(p?.data) ? p.data : Array.isArray(res?.data) ? res.data : [];
                setAllRoles(rows);
            })
            .catch(() => setAllRoles([]));
    }, [user, dispatch]);

    const onAsignar = async () => {
        if (!rolId) return;
        await dispatch(asignarRol({ usuarioId: user.id, rolId: Number(rolId) })).unwrap();
        setRolId('');
    };

    const onRevocar = async (rid) => {
        if (!rid) return;
        await dispatch(revocarRol({ usuarioId: user.id, rolId: Number(rid) })).unwrap();
    };

    return (
        <Modal
            open={open}
            title={`Roles de ${user?.nombre_completo ?? user?.email ?? `#${user?.id}`}`}
            onClose={onClose}
            footer={
                <>
                    <button className="btn-secondary" onClick={onClose} disabled={saving}>Cerrar</button>
                    <button className="btn-primary" onClick={onAsignar} disabled={!rolId || saving}>Asignar rol</button>
                </>
            }
        >
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agregar rol</label>
                    <div className="flex gap-2">
                        <select className="input" value={rolId} onChange={(e) => setRolId(e.target.value)}>
                            <option value="">— Seleccione —</option>
                            {allRoles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold mb-1">Roles actuales</div>
                    {rolesDelUsuario.length === 0 ? (
                        <div className="text-sm text-gray-600">Sin roles</div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {rolesDelUsuario.map(r => (
                                <span key={r.id} className="inline-flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-sm">
                                    {r.nombre}
                                    <button className="btn-danger btn-xs" onClick={() => onRevocar(r.id)} disabled={saving}>Revocar</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
