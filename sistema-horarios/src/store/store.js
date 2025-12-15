import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/gestion-usuarios/authSlice.js';
import docentesReducer from './slices/gestion-academica/docentesSlice.js';
import materiasReducer from './slices/gestion-academica/materiasSlice.js';
import aulasReducer from './slices/gestion-academica/aulasSlice.js';
import gruposReducer from './slices/gestion-academica/gruposSlice.js';
import periodosReducer from './slices/gestion-academica/periodosSlice.js';
import bloquesReducer from './slices/gestion-academica/bloquesSlice.js';
import tipoAulaReducer from './slices/gestion-academica/tipoAulaSlice.js';
import horariosReducer from './slices/gestion-horarios/horariosSlice.js';
import asistenciaReducer from './slices/gestion-asistencia/asistenciaSlice.js';
import usuariosReducer from './slices/gestion-usuarios/usuariosSlice.js';
import rolesReducer from './slices/gestion-usuarios/rolesSlice.js';
import bitacoraReducer from './slices/gestion-usuarios/bitacoraSlice.js';
import userRolesReducer from './slices/gestion-usuarios/userRolesSlice.js';

const store = configureStore({
    reducer: {
        auth: authReducer,
        docentes: docentesReducer,
        materias: materiasReducer,
        aulas: aulasReducer,
        grupos: gruposReducer,
        periodos: periodosReducer,
        bloques: bloquesReducer,
        tipoAula: tipoAulaReducer,
        horarios: horariosReducer,
        asistencia: asistenciaReducer,
        usuarios: usuariosReducer,
        roles: rolesReducer,
        bitacora: bitacoraReducer,
        userRoles: userRolesReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Deshabilitar para manejar funciones no serializables
        }),
    devTools: import.meta.env.DEV // Solo en desarrollo
});

export default store;
