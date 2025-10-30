// src/slices/rolesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const parsePaginator = (resp) => {
    const p = resp?.data?.data ?? {};
    const rows = Array.isArray(p?.data) ? p.data : [];
    const meta = {
        current_page: p?.current_page ?? 1,
        last_page: p?.last_page ?? 1,
        total: p?.total ?? rows.length,
        per_page: p?.per_page ?? (rows.length || 15),
    };
    return { rows, meta };
};

export const fetchRoles = createAsyncThunk(
    'roles/fetch',
    async ({ page = 1 } = {}, { rejectWithValue }) => {
        try {
            const resp = await api.get('/roles', { params: { page } });
            const { rows, meta } = parsePaginator(resp);
            return { rows, meta, page };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

const initialState = {
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, total: 0, per_page: 15, last_page: 1 },
};

const rolesSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {
        clearRolesError: (s) => { s.error = null; },
    },
    extraReducers: (b) => {
        b.addCase(fetchRoles.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchRoles.fulfilled, (s, a) => {
                s.loading = false;
                s.data = a.payload.rows;
                s.pagination = { page: a.payload.page, ...a.payload.meta };
            })
            .addCase(fetchRoles.rejected, (s, a) => {
                s.loading = false; s.error = a.payload || 'Error al cargar roles';
            });
    }
});

export const { clearRolesError } = rolesSlice.actions;
export default rolesSlice.reducer;

// Selectors
const selectSlice = (state) => state.roles;
export const selectRoles = createSelector([selectSlice], (s) => s.data);
export const selectRolesLoading = createSelector([selectSlice], (s) => s.loading);
export const selectRolesError = createSelector([selectSlice], (s) => s.error);
export const selectRolesMeta = createSelector([selectSlice], (s) => s.pagination);