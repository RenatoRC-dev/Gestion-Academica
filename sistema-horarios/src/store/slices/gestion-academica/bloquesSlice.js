// src/slices/bloquesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../../services/api.js';

// Normaliza Laravel paginator { data: { data:[], current_page,... } }
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

export const fetchBloques = createAsyncThunk(
    'bloques/fetch',
    async ({ page = 1 } = {}, { rejectWithValue }) => {
        try {
            const resp = await api.get('/bloques-horarios', { params: { page } });
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

const bloquesSlice = createSlice({
    name: 'bloques',
    initialState,
    reducers: {
        clearBloquesError: (s) => { s.error = null; },
    },
    extraReducers: (b) => {
        b.addCase(fetchBloques.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchBloques.fulfilled, (s, a) => {
                s.loading = false;
                s.data = a.payload.rows;
                s.pagination = { page: a.payload.page, ...a.payload.meta };
            })
            .addCase(fetchBloques.rejected, (s, a) => {
                s.loading = false; s.error = a.payload || 'Error al cargar bloques';
            });
    }
});

export const { clearBloquesError } = bloquesSlice.actions;
export default bloquesSlice.reducer;

// Selectors
const selectSlice = (state) => state.bloques;
export const selectBloques = createSelector([selectSlice], (s) => s.data);
export const selectBloquesLoading = createSelector([selectSlice], (s) => s.loading);
export const selectBloquesError = createSelector([selectSlice], (s) => s.error);
export const selectBloquesMeta = createSelector([selectSlice], (s) => s.pagination);