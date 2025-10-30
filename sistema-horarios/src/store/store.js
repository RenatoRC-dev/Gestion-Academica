import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice.js';
import docentesReducer from './slices/docentesSlice.js';
import materiasReducer from './slices/materiasSlice.js';
import aulasReducer from './slices/aulasSlice.js';
import gruposReducer from './slices/gruposSlice.js';
import periodosReducer from './slices/periodosSlice.js';
import bloquesReducer from './slices/bloquesSlice.js';
import horariosReducer from './slices/horariosSlice.js';
import asistenciaReducer from './slices/asistenciaSlice.js';
import usuariosReducer from './slices/usuariosSlice.js';
import rolesReducer from './slices/rolesSlice.js';
import bitacoraReducer from './slices/bitacoraSlice.js';
import userRolesReducer from './slices/userRolesSlice.js';

const store = configureStore({
    reducer: {
        auth: authReducer,
        docentes: docentesReducer,
        materias: materiasReducer,
        aulas: aulasReducer,
        grupos: gruposReducer,
        periodos: periodosReducer,
        bloques: bloquesReducer,
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