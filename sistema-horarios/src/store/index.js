// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice.js';

import periodosReducer from './slices/periodosSlice.js';
import docentesReducer from './slices/docentesSlice.js';
import usuariosReducer from './slices/usuariosSlice.js';
import userRolesReducer from './slices/userRolesSlice.js';
import bitacoraReducer from './slices/bitacoraSlice.js';
import rolesReducer from './slices/rolesSlice.js';

import horariosReducer from './slices/horariosSlice.js';
import asistenciasReducer from './slices/asistenciaSlice.js';

// ⬇️ Nuevo
import catalogosReducer from './slices/catalogosSlice.js';
import metricasReducer from './metricasSlice.js';

const store = configureStore({
    reducer: {
        auth: authReducer,

        periodos: periodosReducer,
        docentes: docentesReducer,
        usuarios: usuariosReducer,
        userRoles: userRolesReducer,
        bitacora: bitacoraReducer,

        horarios: horariosReducer,
        asistencias: asistenciasReducer,

        // ⬇️ Nuevo
        roles: rolesReducer,
        catalogos: catalogosReducer,
        metricas: metricasReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
    devTools: true,
});

export default store;
