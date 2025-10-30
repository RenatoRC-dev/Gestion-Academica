import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';

/**
 * Protege rutas por autenticación y, opcionalmente, por rol.
 * - Si no hay sesión → redirige a /login.
 * - Si requireRoles está definido → verifica que user.roles contenga alguno.
 *
 * Uso:
 *  <Route element={<ProtectedRoute />}> ... </Route>
 *  <Route element={<ProtectedRoute requireRoles={['ADMIN', 'DOCENTE']} />}> ... </Route>
 */
export default function ProtectedRoute({ requireRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Mostrar pantalla de carga mientras se verifica la sesión
    if (loading) {
        return <div>Cargando...</div>;
    }

    // No hay sesión iniciada
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // TEMP: permitir acceso a todos los usuarios autenticados

    // Comentar la validación de roles para pruebas
    // if (Array.isArray(requireRoles) && requireRoles.length > 0) {
    //     const userRoles = (user.roles || []).map(r => r.nombre?.toLowerCase());
    //     const requiredRoles = requireRoles.map(roleName => roleName.toLowerCase());
    //     const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    //     if (!hasRequiredRole) {
    //         return (
    //             <Navigate
    //                 to="/dashboard"
    //                 replace
    //                 state={{
    //                     error: 'No tienes permisos para acceder a esta página',
    //                     requiredRoles: requireRoles
    //                 }}
    //             />
    //         );
    //     }
    // }

    // Permitir acceso si hay un usuario autenticado
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}

// Componente de utilidad para renderizado condicional
export function Can({ roles, children }) {
    const { user } = useAuth();

    if (!roles) return children;

    const userRoles = (user?.roles || []).map(r => r.nombre?.toLowerCase());
    const requiredRoles = roles.map(roleName => {
        // Permite usar nombres cortos o nombres completos
        switch(roleName.toLowerCase()) {
            case 'admin': return ROLES.ADMIN;
            case 'docente': return ROLES.DOCENTE;
            case 'autoridad': return ROLES.AUTORIDAD;
            default: return roleName.toLowerCase();
        }
    });
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    return hasRequiredRole ? children : null;
}
