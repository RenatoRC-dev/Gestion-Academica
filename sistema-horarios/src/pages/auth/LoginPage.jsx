import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  doLogin,
  clearAuthError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '../../store/slices/authSlice.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectAuthLoading);
  const storeError = useSelector(selectAuthError);
  const isAuth = useSelector(selectIsAuthenticated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (storeError) dispatch(clearAuthError());
      await dispatch(doLogin({ email: email.trim(), password })).unwrap();
      navigate('/dashboard', { replace: true });
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>
        <p className="text-center text-sm text-gray-500 mb-4">Sistema de Planificación y Asistencia</p>

        {storeError && <div className="mb-3 text-sm text-red-600">{storeError}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Institucional</label>
            <input
              type="email"
              className="input w-full"
              placeholder="admin@gestion-academica.edu"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Usa tu cuenta institucional asignada por la coordinación.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="flex gap-2">
              <input
                type={showPwd ? 'text' : 'password'}
                className="input w-full"
                placeholder="********"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={() => setShowPwd((s) => !s)}>
                {showPwd ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button className="btn-primary w-full" disabled={loading || !email || !password}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <div className="mt-3 text-center text-sm text-gray-600">
          ¿No tienes cuenta? <a className="link" href="/registro">Crear Cuenta</a>
        </div>
      </div>
    </div>
  );
}
