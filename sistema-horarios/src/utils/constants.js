// Constantes globales sin depender de process.env

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sistema de Gestión de Horarios';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

export const ROUTES = {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    DOCENTES: '/docentes',
    MATERIAS: '/materias',
    AULAS: '/aulas',
    GRUPOS: '/grupos',
    PERIODOS: '/periodos',
    BLOQUES: '/bloques',
    HORARIOS_GENERAR: '/horarios/generar',
    HORARIOS_VISUALIZAR: '/horarios/visualizar',
    HORARIOS_EDITAR: '/horarios/editar',
    ASISTENCIA_GENERAR_QR: '/asistencia/generar-qr',
    ASISTENCIA_ESCANEAR_QR: '/asistencia/escanear-qr',
    ASISTENCIA_CONFIRMAR: '/asistencia/confirmar',
    USUARIOS: '/usuarios',
    ROLES: '/roles',
    BITACORA: '/bitacora',
};

export const API_ENDPOINTS = {
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_PROFILE: '/auth/profile',
    DOCENTES: '/academica/docentes',
    MATERIAS: '/academica/materias',
    AULAS: '/academica/aulas',
    GRUPOS: '/academica/grupos',
    PERIODOS: '/academica/periodos',
    BLOQUES: '/academica/bloques',
    HORARIOS: '/horarios',
    ASISTENCIA: '/asistencia',
    USUARIOS: '/administracion/usuarios',
    ROLES: '/administracion/roles',
    BITACORA: '/administracion/bitacora',
};

export default {
    API_URL,
    APP_NAME,
    APP_ENV,
    IS_DEVELOPMENT,
    IS_PRODUCTION,
    ROUTES,
    API_ENDPOINTS,
};