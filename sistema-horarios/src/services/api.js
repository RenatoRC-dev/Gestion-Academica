import axios from 'axios';

const RAW = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = RAW.replace(/\/+$/, '');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 20000,
});

// Interceptor de request para inyectar token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de request para loguear solicitudes
api.interceptors.request.use(
    (config) => {
        console.log('Solicitud:', config.method, config.url, config.params);
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de response para manejar errores de autenticación
api.interceptors.response.use(
    (response) => {
        console.log('Respuesta:', response.status, response.config.url, response.data);
        return response;
    },
    (error) => {
        const status = error.response?.status;

        console.error('Error de solicitud:', error.response?.status, error.response?.data);

        // Manejo de errores de autenticación
        if (status === 401 || status === 419) {
            // Limpiar token y datos de usuario
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirigir a login si no está en login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        localStorage.setItem('token', token);
        try { window.dispatchEvent(new Event('storage')); } catch {}
    }
}

export function clearAuthToken() {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('token');
    try { window.dispatchEvent(new Event('storage')); } catch {}
}

export function configurarEncabezados(token) {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

export default api;
