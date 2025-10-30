import React, { useState } from 'react';
import publicApi from '../../services/publicApi.js';

export default function RegisterPage() {
  const [form, setForm] = useState({ nombre_completo: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!form.nombre_completo.trim() || !form.email.trim()) {
      setErr('Nombre y email son obligatorios');
      return;
    }
    setBusy(true);
    try {
      const resp = await publicApi.post('/register', {
        nombre_completo: form.nombre_completo.trim(),
        email: form.email.trim(),
        activo: true,
      });
      const pwd = resp?.data?.password_temporal;
      setMsg(
        pwd
          ? `Tu cuenta fue creada. Password temporal: ${pwd}`
          : 'Cuenta creada. Inicia sesión con la contraseña temporal enviada.'
      );
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setErr('El registro público no está habilitado. Pide acceso al administrador.');
      } else if (status === 422) {
        const first = Object.values(error?.response?.data?.errors || {})[0];
        setErr(Array.isArray(first) ? first.join(', ') : first || 'Datos inválidos');
      } else {
        setErr(error?.response?.data?.message || 'No se pudo registrar');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>
        <p className="text-center text-sm text-gray-500 mb-4">Registro de usuario</p>

        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
        {msg && <div className="mb-3 text-sm text-green-600">{msg}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input className="input w-full" value={form.nombre_completo} onChange={(e)=>setForm(f=>({...f,nombre_completo:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input type="email" className="input w-full" value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))} />
          </div>
          <button className="btn-primary w-full" disabled={busy || !form.nombre_completo || !form.email}>
            {busy ? 'Registrando…' : 'Registrarme'}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Nota: si el servidor requiere autorización, esta pantalla solo mostrará un mensaje para contactar al administrador.
        </div>
      </div>
    </div>
  );
}
