import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';
import { ROLES } from '../utils/roles';

const Item = ({ to, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-white text-gray-900' : 'text-white/90 hover:bg-white/10'}`
        }
    >
        {children}
    </NavLink>
);

export default function NavBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);

    const onLogout = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            setBusy(false);
        }
    };

    const rawRoles = Array.isArray(user?.roles) ? user.roles : [];
    const normalizedRoles = rawRoles
        .map(r => (typeof r === 'string' ? r : r?.nombre))
        .filter(Boolean)
        .map((value) => value.toLowerCase());
    const displayRoles = normalizedRoles.map((value) => value.toUpperCase());
    const isAdmin = normalizedRoles.includes(ROLES.ADMIN);
    const isDocente = normalizedRoles.includes(ROLES.DOCENTE);

    return (
        <header className="bg-gray-900 sticky top-0 z-40 shadow">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <NavLink to="/dashboard" className="text-white font-bold">Gestión Académica</NavLink>
                    <nav className="hidden md:flex items-center gap-1 ml-4">
                        {/* Rutas comunes */}
                        <Item to="/horarios">Horarios</Item>
                        <Item to="/asistencias/qr">Generar y Escanear QR</Item>
                        <Item to="/asistencias/confirmar-virtual">Confirmar Virtual</Item>
                        {isDocente && <Item to="/asistencias/mihistorial">Mi historial</Item>}

                        {/* Rutas de administración */}
                        {isAdmin && (
                            <>
                                <Item to="/usuarios">Usuarios</Item>
                                <Item to="/roles">Roles</Item>
                                <Item to="/bitacora">Bitácora</Item>
                                <Item to="/periodos">Períodos</Item>
                                <Item to="/docentes">Docentes</Item>
                                <Item to="/areas-academicas">Áreas Académicas</Item>
                                <Item to="/areas-administrativas">Áreas Administrativas</Item>
                                <Item to="/aulas">Aulas</Item>
                                <Item to="/materias">Materias</Item>
                                <Item to="/grupos">Grupos</Item>
                                <Item to="/bloques">Bloques Horarios</Item>
                                <Item to="/horarios/generar">Generar Horarios</Item>
                                <Item to="/asistencias/registrar">Registrar Asistencia</Item>
                                <Item to="/asistencias/estados">Estados Asistencia</Item>
                                <Item to="/asistencias/metodos">Métodos Registro</Item>
                                <Item to="/asistencias/historial">Historial Asistencias</Item>
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-white/80 text-sm">
                        {user?.nombre_completo || user?.email}
                        {displayRoles.length > 0 && (
                            <span className="ml-2 text-white/60">({displayRoles.join(', ')})</span>
                        )}
                    </div>
                    <button
                        onClick={onLogout}
                        disabled={busy}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${busy ? 'bg-rose-400' : 'bg-rose-500 hover:bg-rose-600'} text-white`}
                        title="Cerrar sesión"
                    >
                        {busy ? 'Saliendo…' : 'Salir'}
                    </button>
                </div>
            </div>
        </header>
    );
}
