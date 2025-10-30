// src/components/GuardRole.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Este guard asume que en /user llega algo como:
// { id, nombre, ... , roles: [{ id, nombre }, ...] }  ó  roles: ["docente", ...]
// Compara en minúsculas y tolera ambas formas.
function GuardRole({ roles = [], children }) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    const normalize = (s) => String(s || '').trim().toLowerCase();
    const wanted = roles.map(normalize);

    const userRoles = (() => {
        if (Array.isArray(user?.roles)) {
            return user.roles
                .map((r) => (typeof r === 'string' ? r : r?.nombre))
                .filter(Boolean)
                .map(normalize);
        }
        // tolerancia: user.role_name o user.role?.nombre
        if (user?.role_name) return [normalize(user.role_name)];
        if (user?.role?.nombre) return [normalize(user.role.nombre)];
        return [];
    })();

    // Si no se pasa lista de roles, basta con estar autenticado
    const allowed =
        wanted.length === 0 || userRoles.some((r) => wanted.includes(r));

    if (!allowed) return <Navigate to="/" replace />;
    return children;
}

export default GuardRole;
