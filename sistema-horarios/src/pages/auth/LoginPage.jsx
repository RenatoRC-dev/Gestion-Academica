import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal.jsx';
import Alert from '../../components/Alert.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import authService from '../../services/gestion-usuarios/authService.js';
import {
  doLogin,
  clearAuthError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '../../store/slices/gestion-usuarios/authSlice.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

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
        {recoveryMessage && (
          <div className="mb-3">
            <Alert type="success" message={recoveryMessage} onClose={() => setRecoveryMessage(null)} />
          </div>
        )}

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
        ¿Olvidaste tu contraseña?{' '}
        <button type="button" className="link" onClick={() => setRecoveryOpen(true)}>
          Recuperarla
        </button>
      </div>
      <Modal open={recoveryOpen} title="Recuperar contraseña" onClose={() => setRecoveryOpen(false)}>
        <form
          className="form-layout"
          onSubmit={async (event) => {
            event.preventDefault();
            setRecoveryLoading(true);
            try {
              const response = await authService.recoverPassword(recoveryEmail.trim());
              if (response?.success) {
                const message = `Contraseña temporal: ${response.password_temporal || 'Revise su correo'}`;
                toast.push(message, 'success');
                setRecoveryMessage(message);
                setRecoveryOpen(false);
                setRecoveryEmail('');
              } else {
                toast.push(response?.message || 'No se pudo recuperar la contraseña', 'error');
              }
            } catch (error) {
              toast.push(
                error?.response?.data?.message || 'Error al recuperar la contraseña',
                'error'
              );
            } finally {
              setRecoveryLoading(false);
            }
          }}
        >
          <div className="form-section">
            <p className="form-section-title">Ingresa tu correo institucional</p>
            <div className="form-grid">
              <div className="form-field">
                <input
                  className="input"
                  type="email"
                  placeholder="usuario@gestion-academica.edu"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setRecoveryOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={recoveryLoading}>
              {recoveryLoading ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
    </div>
  );
}
