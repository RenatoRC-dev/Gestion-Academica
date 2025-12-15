// src/slices/userRolesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../../services/api.js';

// Nota: contratos basados en rutas reales del backend.
// GET:    /usuarios/{usuario}/roles
// POST:   /usuarios/{usuario}/roles/asignar    body esperado: { rol_id }
// POST:   /usuarios/{usuario}/roles/revocar    body esperado: { rol_id }

export const fetchRolesDelUsuario = createAsyncThunk(
    'userRoles/fetchRolesDelUsuario',
    async ({ usuarioId }, { rejectWithValue }) => {
        try {
            const resp = await api.get(`/usuarios/${usuarioId}/roles`);
            // Backend: { success, data: { usuario_id, roles: [] } }
            const payload = resp?.data?.data;
            const roles = Array.isArray(payload?.roles)
                ? payload.roles
                : Array.isArray(resp?.data)
                    ? resp.data
                    : Array.isArray(resp?.data?.roles)
                        ? resp.data.roles
                        : [];
            return { usuarioId, roles };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

export const asignarRol = createAsyncThunk(
    'userRoles/asignarRol',
    async ({ usuarioId, rolId }, { rejectWithValue }) => {
        try {
            await api.post(`/usuarios/${usuarioId}/roles/asignar`, { rol_id: rolId });
            // Tras asignar, recargar la lista real de roles del usuario
            const follow = await api.get(`/usuarios/${usuarioId}/roles`);
            const payload = follow?.data?.data;
            const roles = Array.isArray(payload?.roles) ? payload.roles : [];
            return { usuarioId, roles };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

export const revocarRol = createAsyncThunk(
    'userRoles/revocarRol',
    async ({ usuarioId, rolId }, { rejectWithValue }) => {
        try {
            await api.post(`/usuarios/${usuarioId}/roles/revocar`, { rol_id: rolId });
            // Tras revocar, recargar lista real
            const follow = await api.get(`/usuarios/${usuarioId}/roles`);
            const payload = follow?.data?.data;
            const roles = Array.isArray(payload?.roles) ? payload.roles : [];
            return { usuarioId, roles };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

const slice = createSlice({
    name: 'userRoles',
    initialState: {
        byUser: {}, // { [usuarioId]: [roles] }
        loading: false,
        error: null,
        saving: false,
    },
    reducers: {
        clearUserRolesError: (s) => { s.error = null; },
    },
    extraReducers: (b) => {
        b.addCase(fetchRolesDelUsuario.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchRolesDelUsuario.fulfilled, (s, a) => {
                s.loading = false;
                s.byUser[a.payload.usuarioId] = a.payload.roles;
            })
            .addCase(fetchRolesDelUsuario.rejected, (s, a) => { s.loading = false; s.error = a.payload || 'Error al cargar roles'; });

        b.addCase(asignarRol.pending, (s) => { s.saving = true; s.error = null; })
            .addCase(asignarRol.fulfilled, (s, a) => {
                s.saving = false;
                s.byUser[a.payload.usuarioId] = a.payload.roles;
            })
            .addCase(asignarRol.rejected, (s, a) => { s.saving = false; s.error = a.payload || 'Error al asignar rol'; });

        b.addCase(revocarRol.pending, (s) => { s.saving = true; s.error = null; })
            .addCase(revocarRol.fulfilled, (s, a) => {
                s.saving = false;
                s.byUser[a.payload.usuarioId] = a.payload.roles;
            })
            .addCase(revocarRol.rejected, (s, a) => { s.saving = false; s.error = a.payload || 'Error al revocar rol'; });
    }
});

export const { clearUserRolesError } = slice.actions;
export default slice.reducer;

const selectSlice = (st) => st.userRoles;
export const selectUserRoles = (usuarioId) => createSelector([selectSlice], (s) =>
    Array.isArray(s.byUser[usuarioId]) ? s.byUser[usuarioId] : []
);
export const selectUserRolesLoading = createSelector([selectSlice], (s) => s.loading);
export const selectUserRolesSaving = createSelector([selectSlice], (s) => s.saving);
export const selectUserRolesError = createSelector([selectSlice], (s) => s.error);
