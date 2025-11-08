// src/config/api.js

// Base sacada del .env; por defecto apunta al backend local con /api
const RAW = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Normalizamos: quitamos barras finales para evitar ".../api//login"
const BASE = RAW.replace(/\/+$/, '');

export const API_CONFIG = {
    BASE_URL: BASE,
    TIMEOUT: 10000,
    HEADERS: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
};

// Helper para componer URLs garantizando una sola “/”
export const apiUrl = (path) =>
    `${API_CONFIG.BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
