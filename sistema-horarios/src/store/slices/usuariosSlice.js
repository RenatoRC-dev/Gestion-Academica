// src/slices/usuariosSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api.js';

// Helpers paginator (Laravel)
const parsePaginator = (resp) => {
    const p = resp?.data?.data ?? {};
    const rows = Array.isArray(p?.data) ? p.data : [];
    const meta = {
        current_page: p?.current_page ?? 1,
        last_page: p?.last_page ?? 1,
        total: p?.total ?? rows.length,
        per_page: (p?.per_page ?? rows.length) || 15,
    };
    return { rows, meta };
};

// LIST
export const fetchUsuarios = createAsyncThunk('usuarios/fetch', async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
        const resp = await api.get('/usuarios', { params: { page } });
        const { rows, meta } = parsePaginator(resp);
        return { rows, meta, page };
    } catch (e) {
        return rejectWithValue(e?.response?.data?.message || e.message);
    }
});

// CREATE  payload: { nombre_completo, email, activo? }
export const createUsuario = createAsyncThunk('usuarios/create', async (payload, { rejectWithValue }) => {
    try {
        const resp = await api.post('/usuarios', payload);
        const data = resp?.data;
        return {
            usuario: data?.data ?? null,
            password_temporal: data?.password_temporal ?? null,
        };
    } catch (e) {
        return rejectWithValue({ message: e?.response?.data?.message || e.message, errors: e?.response?.data?.errors });
    }
});

// UPDATE  payload: { id, ...changes }
export const updateUsuario = createAsyncThunk('usuarios/update', async ({ id, ...changes }, { rejectWithValue }) => {
    try {
        const resp = await api.put(`/usuarios/${id}`, changes);
        return resp?.data?.data ?? resp?.data;
    } catch (e) {
        return rejectWithValue({ message: e?.response?.data?.message || e.message, errors: e?.response?.data?.errors });
    }
});

// DELETE maneja 422 cuando es el último admin
export const deleteUsuario = createAsyncThunk('usuarios/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/usuarios/${id}`);
        return id;
    } catch (e) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e.message;
        return rejectWithValue({ message: msg, status });
    }
});

const initialState = {
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, total: 0, per_page: 15, last_page: 1 },
    saving: false,
    saveError: null,
    deleting: false,
    lastDeleteError: null,
    lastPasswordTemporal: null,
};

const usuariosSlice = createSlice({
    name: 'usuarios',
    initialState,
    reducers: {
        clearUsuariosError: (s) => { s.error = null; },
        clearUsuariosSaveError: (s) => { s.saveError = null; },
        clearUsuariosDeleteError: (s) => { s.lastDeleteError = null; },
        clearUsuariosPasswordTemp: (s) => { s.lastPasswordTemporal = null; },
    },
    extraReducers: (b) => {
        b.addCase(fetchUsuarios.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchUsuarios.fulfilled, (s, a) => {
                s.loading = false; s.data = a.payload.rows;
                s.pagination = { page: a.payload.page, ...a.payload.meta };
            })
            .addCase(fetchUsuarios.rejected, (s, a) => { s.loading = false; s.error = a.payload || 'Error al cargar usuarios'; });

        b.addCase(createUsuario.pending, (s) => { s.saving = true; s.saveError = null; s.lastPasswordTemporal = null; })
            .addCase(createUsuario.fulfilled, (s, a) => {
                s.saving = false;
                const u = a.payload?.usuario;
                if (u?.id) { s.data = [u, ...s.data]; s.pagination.total += 1; }
                s.lastPasswordTemporal = a.payload?.password_temporal || null;
            })
            .addCase(createUsuario.rejected, (s, a) => { s.saving = false; s.saveError = a.payload || { message: 'Error al crear usuario' }; });

        b.addCase(updateUsuario.pending, (s) => { s.saving = true; s.saveError = null; })
            .addCase(updateUsuario.fulfilled, (s, a) => {
                s.saving = false;
                const updated = a.payload;
                if (updated?.id) s.data = s.data.map((it) => (it.id === updated.id ? { ...it, ...updated } : it));
            })
            .addCase(updateUsuario.rejected, (s, a) => { s.saving = false; s.saveError = a.payload || { message: 'Error al actualizar usuario' }; });

        b.addCase(deleteUsuario.pending, (s) => { s.deleting = true; s.lastDeleteError = null; })
            .addCase(deleteUsuario.fulfilled, (s, a) => {
                s.deleting = false;
                const id = a.payload;
                s.data = s.data.filter((it) => it.id !== id);
                s.pagination.total = Math.max(0, s.pagination.total - 1);
            })
            .addCase(deleteUsuario.rejected, (s, a) => { s.deleting = false; s.lastDeleteError = a.payload || { message: 'Error al eliminar usuario' }; });
    }
});

export const {
    clearUsuariosError, clearUsuariosSaveError, clearUsuariosDeleteError, clearUsuariosPasswordTemp
} = usuariosSlice.actions;

export default usuariosSlice.reducer;

// Selectors
const selectSlice = (st) => st.usuarios;
export const selectUsuarios = createSelector([selectSlice], (s) => s.data);
export const selectUsuariosLoading = createSelector([selectSlice], (s) => s.loading);
export const selectUsuariosError = createSelector([selectSlice], (s) => s.error);
export const selectUsuariosMeta = createSelector([selectSlice], (s) => s.pagination);
export const selectUsuariosSaving = createSelector([selectSlice], (s) => s.saving);
export const selectUsuariosSaveError = createSelector([selectSlice], (s) => s.saveError);
export const selectUsuariosDeleting = createSelector([selectSlice], (s) => s.deleting);
export const selectUsuariosDeleteError = createSelector([selectSlice], (s) => s.lastDeleteError);
export const selectUsuariosPasswordTemp = createSelector([selectSlice], (s) => s.lastPasswordTemporal);
