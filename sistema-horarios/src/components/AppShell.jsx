import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
    FaBars,
    FaBook,
    FaBuilding,
    FaCalendarAlt,
    FaChalkboardTeacher,
    FaClipboardList,
    FaFileAlt,
    FaFileUpload,
    FaLandmark,
    FaListAlt,
    FaQrcode,
    FaRegCalendarCheck,
    FaSchool,
    FaSignOutAlt,
    FaTable,
    FaUser,
    FaUsers,
    FaUserTie,
} from 'react-icons/fa';
import Modal from './Modal.jsx';
import { useToast } from './ToastProvider.jsx';
import { registerSW } from 'virtual:pwa-register';
import { suppressOnlineWindow } from '../services/api.js';

const Item = ({ to, icon: Icon, children, onClick, collapsed }) => (
    <NavLink
        to={to}
        title={typeof children === 'string' ? children : undefined}
        aria-label={typeof children === 'string' ? children : undefined}
        onClick={onClick}
        className={({ isActive }) => 'appshell-item ' + (isActive ? 'active' : '')}
    >
        {Icon && <Icon className="appshell-item-icon" aria-hidden />}
        <span className="appshell-item-text" aria-hidden={collapsed}>
            {children}
        </span>
    </NavLink>
);

export default function AppShell({ children }) {
    const { user, logout, changePassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const prefersDesktop = () => (typeof window === 'undefined' ? true : window.innerWidth >= 1024);
    const [isDesktop, setIsDesktop] = useState(prefersDesktop);
    const [sidebarOpen, setSidebarOpen] = useState(prefersDesktop);
    const toast = useToast();
    const [isOffline, setIsOffline] = useState(() =>
        typeof navigator === 'undefined' ? false : !navigator.onLine
    );
    const [needRefresh, setNeedRefresh] = useState(false);
    const updateServiceWorker = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        const handleNetworkState = (event) => {
            const online = event?.detail?.online;
            if (typeof online === 'boolean') {
                setIsOffline(!online);
            }
        };
        const handleWorkerMessage = (event) => {
            if (event?.data?.type === 'WORKBOX_NETWORK_FAILURE') {
                setIsOffline(true);
                suppressOnlineWindow(3000);
            }
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('app-network-state', handleNetworkState);
        if ('serviceWorker' in navigator && navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
        }
        window.addEventListener('message', handleWorkerMessage);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('app-network-state', handleNetworkState);
            if ('serviceWorker' in navigator && navigator.serviceWorker) {
                navigator.serviceWorker.removeEventListener('message', handleWorkerMessage);
            }
            window.removeEventListener('message', handleWorkerMessage);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        updateServiceWorker.current = registerSW({
            onNeedRefresh() {
                setNeedRefresh(true);
                toast.push('Nueva versión disponible. Haz clic en "Actualizar app" cuando quieras refrescar.', 'info');
            },
            onOfflineReady() {
                toast.push('La aplicación está lista para usarse sin conexión.', 'success');
            },
        });
    }, [toast]);

    const handleUpdateApp = async () => {
        if (!updateServiceWorker.current) {
            return;
        }
        try {
            await updateServiceWorker.current();
            window.location.reload();
        } catch (error) {
            toast.push('No se pudo actualizar la aplicación. Intenta recargar manualmente.', 'error');
        }
    };
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current_password: false,
        new_password: false,
        confirm_password: false,
    });
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setSidebarOpen(isDesktop);
    }, [isDesktop]);

    const rawRoles = Array.isArray(user?.roles) ? user.roles : [];
    const normalizedRoles = rawRoles
        .map((r) => (typeof r === 'string' ? r : r?.nombre))
        .filter(Boolean)
        .map((value) => value.toLowerCase());
    const displayRoles = normalizedRoles.map((value) => value.toUpperCase());
    const isAdmin = normalizedRoles.includes('administrador_academico');
    const isDocente = normalizedRoles.includes('docente');
    const hasRole = (role) => normalizedRoles.includes(role.toLowerCase());

    const onLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.push('La confirmación no coincide', 'error');
            return;
        }
        setChangingPassword(true);
        try {
            const response = await changePassword(
                passwordForm.current_password,
                passwordForm.new_password,
                passwordForm.confirm_password
            );
            if (response?.success) {
                toast.push(response.message || 'Contraseña actualizada', 'success');
                setPasswordModalOpen(false);
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                });
            } else {
                toast.push(response?.message || 'No se pudo cambiar la contraseña', 'error');
            }
        } catch (error) {
            toast.push(error?.response?.data?.message || error?.message || 'Error cambiando la contraseña', 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    const closeSidebarOnMobile = () => {
        if (!isDesktop) {
            setSidebarOpen(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen((open) => !open);

    const onAuthRoute =
        location.pathname.startsWith('/login') || location.pathname.startsWith('/registro');

    if (onAuthRoute) {
        return <>{children}</>;
    }

    const navSections = [
        {
            title: 'GENERAL',
            items: [{ to: '/dashboard', icon: FaTable, label: 'Dashboard' }],
        },
        {
            title: 'PLANIFICACIÓN',
            items: [
                { to: '/horarios', icon: FaCalendarAlt, label: 'Horarios' },
                { to: '/horarios/generar', icon: FaRegCalendarCheck, label: 'Generar horario' },
            ],
        },
        {
            title: 'ASISTENCIA',
            items: [
                { to: '/asistencias/qr', icon: FaQrcode, label: 'Generar y Escanear QR' },
                { to: '/asistencias/confirmar-virtual', icon: FaClipboardList, label: 'Confirmar asistencia' },
                {
                    to: '/asistencias/registrar',
                    icon: FaUserTie,
                    label: 'Registrar asistencia',
                    roles: ['administrador_academico'],
                },
                {
                    to: '/asistencias/estados',
                    icon: FaClipboardList,
                    label: 'Estados de asistencia',
                    roles: ['administrador_academico'],
                },
                {
                    to: '/asistencias/metodos',
                    icon: FaListAlt,
                    label: 'Métodos de registro',
                    roles: ['administrador_academico'],
                },
                {
                    to: '/asistencias/historial',
                    icon: FaFileAlt,
                    label: 'Historial general',
                    roles: ['administrador_academico'],
                },
                {
                    to: '/asistencias/mihistorial',
                    icon: FaFileAlt,
                    label: 'Mi historial',
                    roles: ['docente'],
                },
            ],
        },
    ];

    if (isAdmin) {
        navSections.push({
            title: 'ADMINISTRACIÓN',
            items: [
                { to: '/docentes', icon: FaChalkboardTeacher, label: 'Docentes' },
                { to: '/areas-academicas', icon: FaBook, label: 'Áreas académicas' },
                { to: '/areas-administrativas', icon: FaLandmark, label: 'Áreas administrativas' },
                { to: '/administrativos', icon: FaUserTie, label: 'Administrativos' },
                { to: '/materias', icon: FaBook, label: 'Materias' },
                { to: '/aulas', icon: FaBuilding, label: 'Aulas' },
                { to: '/tipos-aula', icon: FaSchool, label: 'Tipos de aula' },
                { to: '/grupos', icon: FaUsers, label: 'Grupos' },
                { to: '/bloques', icon: FaCalendarAlt, label: 'Bloques horario' },
                { to: '/periodos', icon: FaCalendarAlt, label: 'Períodos' },
                { to: '/usuarios', icon: FaUser, label: 'Usuarios' },
                { to: '/usuarios/importar', icon: FaFileUpload, label: 'Importar usuarios' },
                { to: '/roles', icon: FaUsers, label: 'Roles' },
                { to: '/bitacora', icon: FaClipboardList, label: 'Bitácora' },
            ],
        });
    }

    const shellClass = [
        'appshell',
        isDesktop ? 'appshell-desktop' : 'appshell-mobile',
        sidebarOpen ? 'appshell-sidebar-open' : 'appshell-sidebar-collapsed',
    ].join(' ');

    return (
        <div className={shellClass}>
            <header className="appshell-topbar">
                <button
                    type="button"
                    className="appshell-burger"
                    title="Menú"
                    aria-label="Abrir o cerrar el menú"
                    aria-expanded={sidebarOpen}
                    onClick={toggleSidebar}
                >
                    <FaBars />
                </button>
                <div
                    className="appshell-brand"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/dashboard')}
                    onKeyDown={(e) => (e.key === 'Enter' ? navigate('/dashboard') : undefined)}
                >
                    Gestión Académica
                </div>
                <div className="appshell-spacer" />
                <div className="appshell-status-group">
                    <span className={`appshell-status ${isOffline ? 'offline' : 'online'}`}>
                        {isOffline ? 'Modo offline' : 'Conectado'}
                    </span>
                    {needRefresh && (
                        <button
                            type="button"
                            className="appshell-status-update"
                            onClick={handleUpdateApp}
                        >
                            Actualizar app
                        </button>
                    )}
                </div>
                <div className="appshell-user">
                    <span className="appshell-user-name">{user?.nombre_completo || user?.email}</span>
                    {displayRoles.length > 0 && (
                        <span className="appshell-user-role">({displayRoles.join(', ')})</span>
                    )}
                    <button
                        type="button"
                        className="appshell-user-link"
                        onClick={() => setPasswordModalOpen(true)}
                        title="Cambiar contraseña"
                        aria-label="Cambiar contraseña"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#2563eb',
                            fontSize: '0.875rem',
                            marginLeft: '1rem',
                            cursor: 'pointer',
                        }}
                    >
                        Cambiar contraseña
                    </button>
                    <button
                        type="button"
                        className="appshell-logout"
                        onClick={onLogout}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                    >
                        <FaSignOutAlt />
                    </button>
                </div>
            </header>

            <aside className="appshell-sidenav" role="navigation" aria-label="Menú principal">
                {navSections.map(({ title, items }) => (
                    <div key={title} className="appshell-navgroup">
                        <div className="appshell-section">{title}</div>
                        {items
                .filter((link) => !link.roles || link.roles.some((required) => hasRole(required)))
                            .map((link) => (
                                <Item
                                    key={link.to}
                                    to={link.to}
                                    icon={link.icon}
                                    collapsed={isDesktop && !sidebarOpen}
                                    onClick={closeSidebarOnMobile}
                                >
                                {link.label}
                            </Item>
                        ))}
                    </div>
                ))}
            </aside>

            <main className="appshell-content">{children}</main>

            <div className="appshell-overlay" onClick={closeSidebarOnMobile} role="presentation" />
            <Modal
                open={passwordModalOpen}
                title="Cambiar contraseña"
                onClose={() => setPasswordModalOpen(false)}
            >
                <form onSubmit={handlePasswordSubmit} className="form-layout">
                    <div className="form-section">
                        <p className="form-section-title">Seguridad</p>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Contraseña actual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type={showPasswords.current_password ? 'text' : 'password'}
                                        min="6"
                                        value={passwordForm.current_password}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                current_password: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            background: 'none',
                                            color: '#2563eb',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => togglePasswordVisibility('current_password')}
                                    >
                                        {showPasswords.current_password ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-field">
                                <label>Nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type={showPasswords.new_password ? 'text' : 'password'}
                                        min="6"
                                        value={passwordForm.new_password}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                new_password: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            background: 'none',
                                            color: '#2563eb',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => togglePasswordVisibility('new_password')}
                                    >
                                        {showPasswords.new_password ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-field">
                                <label>Confirmar contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type={showPasswords.confirm_password ? 'text' : 'password'}
                                        min="6"
                                        value={passwordForm.confirm_password}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                confirm_password: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            background: 'none',
                                            color: '#2563eb',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => togglePasswordVisibility('confirm_password')}
                                    >
                                        {showPasswords.confirm_password ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setPasswordModalOpen(false)}
                            disabled={changingPassword}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={changingPassword}>
                            {changingPassword ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
