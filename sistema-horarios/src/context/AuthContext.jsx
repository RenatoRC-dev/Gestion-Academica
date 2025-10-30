// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Bootstrap: si hay token pero no user, cargar /user
  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        if (token && !user) {
          const me = await authService.getCurrentUser();
          if (active && me.success && me.user) {
            setUser(me.user);
            localStorage.setItem('user', JSON.stringify(me.user));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    boot();
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      setToken(localStorage.getItem('token'));
      try {
        const me = await authService.getCurrentUser();
        if (me.success && me.user) {
          setUser(me.user);
          localStorage.setItem('user', JSON.stringify(me.user));
        } else {
          // fallback a lo que dejó login
          setUser(JSON.parse(localStorage.getItem('user') || 'null'));
        }
      } catch {
        setUser(JSON.parse(localStorage.getItem('user') || 'null'));
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  // Sincronizar cambios desde otras pestañas
  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem('token'));
      try { setUser(JSON.parse(localStorage.getItem('user'))); } catch { setUser(null); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ token, user, loading, login, logout }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

