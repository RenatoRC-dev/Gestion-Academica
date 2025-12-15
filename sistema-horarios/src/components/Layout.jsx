import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/gestion-usuarios/authSlice.js';

function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-0'
                    } bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-lg transition-all duration-300 overflow-y-auto`}
            >
                <div className="p-6 border-b border-blue-600">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-3xl">🎓</span> Horarios
                    </h1>
                </div>

                <nav className="mt-6 space-y-1">
                    <NavItem to="/dashboard" label="📊 Dashboard" isActive={isActive('/dashboard')} />

                    <div className="px-6 py-3 mt-6">
                        <p className="text-xs font-semibold text-blue-200 uppercase">Gestión Académica</p>
                    </div>
                    <NavItem to="/docentes" label="👨‍🏫 Docentes" isActive={isActive('/docentes')} />
                    <NavItem to="/areas-academicas" label="🗂️ Áreas Académicas" isActive={isActive('/areas-academicas')} />
                    <NavItem to="/materias" label="📚 Materias" isActive={isActive('/materias')} />
                    <NavItem to="/aulas" label="🏫 Aulas" isActive={isActive('/aulas')} />
                    <NavItem to="/grupos" label="👥 Grupos" isActive={isActive('/grupos')} />
                    <NavItem to="/periodos" label="📅 Períodos" isActive={isActive('/periodos')} />
                    <NavItem to="/bloques" label="⏰ Bloques" isActive={isActive('/bloques')} />

                    <div className="px-6 py-3 mt-6">
                        <p className="text-xs font-semibold text-blue-200 uppercase">Horarios</p>
                    </div>
                    <NavItem to="/horarios/generar" label="⚙️ Generar" isActive={isActive('/horarios/generar')} />
                    <NavItem to="/horarios/visualizar" label="👁️ Visualizar" isActive={isActive('/horarios/visualizar')} />
                    <NavItem to="/horarios/editar" label="✏️ Editar" isActive={isActive('/horarios/editar')} />

                    <div className="px-6 py-3 mt-6">
                        <p className="text-xs font-semibold text-blue-200 uppercase">Asistencia</p>
                    </div>
                    <NavItem to="/asistencias/qr" label="🔐 Generar y Escanear QR" isActive={isActive("/asistencias/qr")} />
                    <NavItem to="/asistencia/confirmar" label="✓ Confirmar" isActive={isActive('/asistencia/confirmar')} />

                    <div className="px-6 py-3 mt-6">
                        <p className="text-xs font-semibold text-blue-200 uppercase">Administración</p>
                    </div>
                    <NavItem to="/usuarios" label="👤 Usuarios" isActive={isActive('/usuarios')} />
                    <NavItem to="/roles" label="🔑 Roles" isActive={isActive('/roles')} />
                    <NavItem to="/bitacora" label="📋 Bitácora" isActive={isActive('/bitacora')} />
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-600">
                    <button
                        onClick={handleLogout}
                        className="w-full btn-danger text-white"
                    >
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow">
                    <div className="flex items-center justify-between h-16 px-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-2xl text-gray-600 hover:text-blue-600 transition"
                        >
                            {sidebarOpen ? '◀️' : '▶️'}
                        </button>

                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 font-medium">{user?.email || 'Usuario'}</span>
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                👤
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function NavItem({ to, label, isActive }) {
    return (
        <Link
            to={to}
            className={`block px-6 py-2 rounded-lg transition ${isActive
                ? 'bg-blue-500 text-white font-semibold'
                : 'text-blue-100 hover:bg-blue-600'
                }`}
        >
            {label}
        </Link>
    );
}

export default Layout;
