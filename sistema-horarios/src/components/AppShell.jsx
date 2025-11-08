import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FaBars,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaSignOutAlt,
  FaListAlt,
  FaQrcode,
  FaSchool,
  FaTable,
  FaUser,
  FaUsers,
} from 'react-icons/fa';

const Item = ({ to, icon: Icon, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => 'appshell-item ' + (isActive ? 'active' : '')}
  >
    {Icon && <Icon className="appshell-item-icon" />}
    <span className="appshell-item-text">{children}</span>
  </NavLink>
);

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.nombre)).filter(Boolean)
    : [];
  const isAdmin = roles.includes('administrador_academico');

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`appshell ${open ? 'appshell-open' : 'appshell-closed'}`}>
      <header className="appshell-topbar">
        <button
          className="appshell-burger"
          title="Menú"
          aria-label="Abrir/cerrar menú"
          onClick={() => setOpen((o) => !o)}
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
          <button className="appshell-logout" onClick={onLogout} title="Cerrar sesión">
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      <aside className="appshell-sidenav">
        <div className="appshell-section">General</div>
        <Item to="/dashboard" icon={FaTable}>Dashboard</Item>
        <Item to="/horarios" icon={FaCalendarAlt}>Horarios</Item>
        <Item to="/horarios/generar" icon={FaListAlt}>Generar Horario</Item>
        <Item to="/asistencias/generar-qr" icon={FaQrcode}>Generar QR</Item>

        {isAdmin && (
          <>
            <div className="appshell-section">Académico</div>
            <Item to="/docentes" icon={FaChalkboardTeacher}>Docentes</Item>
            <Item to="/aulas" icon={FaSchool}>Aulas</Item>
            <Item to="/materias" icon={FaListAlt}>Materias</Item>
            <Item to="/grupos" icon={FaUsers}>Grupos</Item>
            <Item to="/periodos" icon={FaCalendarAlt}>Períodos</Item>

            <div className="appshell-section">Administración</div>
            <Item to="/usuarios" icon={FaUser}>Usuarios</Item>
            <Item to="/bitacora" icon={FaListAlt}>Bitácora</Item>
          </>
        )}
      </aside>

      <main className="appshell-content">{children}</main>
    </div>
  );
}

