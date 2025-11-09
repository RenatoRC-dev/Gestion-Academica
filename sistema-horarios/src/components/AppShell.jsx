import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
    FaBars,
    FaCalendarAlt,
    FaChalkboardTeacher,
    FaListAlt,
    FaQrcode,
    FaSchool,
    FaSignOutAlt,
    FaTable,
    FaUser,
    FaUsers,
} from 'react-icons/fa';

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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const prefersDesktop = () => (typeof window === 'undefined' ? true : window.innerWidth >= 1024);
    const [isDesktop, setIsDesktop] = useState(prefersDesktop);
    const [sidebarOpen, setSidebarOpen] = useState(prefersDesktop);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setSidebarOpen(isDesktop);
    }, [isDesktop]);

    const roles = Array.isArray(user?.roles)
        ? user.roles.map((r) => (typeof r === 'string' ? r : r?.nombre)).filter(Boolean)
        : [];
    const isAdmin = roles.includes('administrador_academico');

    const onLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
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
                { to: '/horarios/generar', icon: FaListAlt, label: 'Generar horario' },
            ],
        },
        {
            title: 'ASISTENCIA',
            items: [
                { to: '/asistencias/generar-qr', icon: FaQrcode, label: 'Generar QR' },
                { to: '/asistencias/escanear-qr', icon: FaQrcode, label: 'Escanear QR' },
                { to: '/asistencias/confirmar-virtual', icon: FaListAlt, label: 'Confirmar asistencia' },
            ],
        },
    ];

    if (isAdmin) {
        navSections.push({
            title: 'ADMINISTRACIÓN',
            items: [
                { to: '/docentes', icon: FaChalkboardTeacher, label: 'Docentes' },
                { to: '/materias', icon: FaListAlt, label: 'Materias' },
                { to: '/aulas', icon: FaSchool, label: 'Aulas' },
                { to: '/grupos', icon: FaUsers, label: 'Grupos' },
                { to: '/periodos', icon: FaCalendarAlt, label: 'Períodos' },
                { to: '/usuarios', icon: FaUser, label: 'Usuarios' },
                { to: '/roles', icon: FaUsers, label: 'Roles' },
                { to: '/bitacora', icon: FaListAlt, label: 'Bitácora' },
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
                <div className="appshell-user">
                    <span className="appshell-user-name">{user?.nombre_completo || user?.email}</span>
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
                        {items.map((link) => (
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
        </div>
    );
}
