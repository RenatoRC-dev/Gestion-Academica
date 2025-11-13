// src/services/api.js
import axios from 'axios';

// ===== Normalización de la base =====
const RAW = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = RAW.replace(/\/+$/, '');

// ===== Instancia Axios =====
const api = axios.create({
    baseURL: API_URL, // p. ej.: http://ga-backend-prod.../api
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    timeout: 20000,
});

// Helper para construir paths con 1 sola “/”
export const apiUrl = (path) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

let onlineSuppressionUntil = 0;
export const suppressOnlineWindow = (ms = 5000) => {
    onlineSuppressionUntil = Math.max(onlineSuppressionUntil, Date.now() + ms);
};

const dispatchNetworkState = (online) => {
    if (typeof window === 'undefined') return;
    if (online && Date.now() < onlineSuppressionUntil) {
        return;
    }

    const event = new CustomEvent('app-network-state', { detail: { online } });
    window.dispatchEvent(event);
};

// ===== Interceptores =====
// Inyectar token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Log de solicitudes (útil en dev)
api.interceptors.request.use(
    (config) => {
        console.log('Solicitud:', config.method, config.url, config.params);
        return config;
    },
    (error) => Promise.reject(error)
);

// Manejo de respuestas y auth
api.interceptors.response.use(
    (response) => {
        console.log('Respuesta:', response.status, response.config.url, response.data);
        if (typeof navigator === 'undefined' || navigator.onLine) {
            dispatchNetworkState(true);
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;
        console.error('Error de solicitud:', status, error.response?.data);
        if (!error.response && error.code !== 'ECONNABORTED') {
            dispatchNetworkState(false);
        }

        // Si expira o es inválido el token
        if (status === 401 || status === 419) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ===== Helpers para token =====
export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        localStorage.setItem('token', token);
        try { window.dispatchEvent(new Event('storage')); } catch { }
    }
}

export function clearAuthToken() {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('token');
    try { window.dispatchEvent(new Event('storage')); } catch { }
}

// Encabezados ad hoc
export function configurarEncabezados(token) {
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export default api;
