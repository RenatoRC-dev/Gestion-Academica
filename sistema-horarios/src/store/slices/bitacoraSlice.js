// src/slices/bitacoraSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api.js';

// LIST
export const fetchBitacora = createAsyncThunk('bitacora/fetch', async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
        const resp = await api.get('/bitacora', { params: { page } });
        const p = resp?.data?.data ?? {};
        const rows = Array.isArray(p?.data) ? p.data : [];
        const meta = {
            current_page: p?.current_page ?? 1,
            last_page: p?.last_page ?? 1,
            total: p?.total ?? rows.length,
            per_page: (p?.per_page ?? rows.length) || 15,
        };
        return { rows, meta, page };
    } catch (e) {
        return rejectWithValue(e?.response?.data?.message || e.message);
    }
});

const slice = createSlice({
    name: 'bitacora',
    initialState: {
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, total: 0, per_page: 15, last_page: 1 },
    },
    reducers: {},
    extraReducers: (b) => {
        b.addCase(fetchBitacora.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchBitacora.fulfilled, (s, a) => {
                s.loading = false; s.data = a.payload.rows;
                s.pagination = { page: a.payload.page, ...a.payload.meta };
            })
            .addCase(fetchBitacora.rejected, (s, a) => { s.loading = false; s.error = a.payload || 'Error al cargar bitácora'; });
    }
});

export default slice.reducer;

// selectors
const selectSlice = (st) => st.bitacora;
export const selectBitacora = createSelector([selectSlice], (s) => s.data);
export const selectBitacoraLoading = createSelector([selectSlice], (s) => s.loading);
export const selectBitacoraError = createSelector([selectSlice], (s) => s.error);
export const selectBitacoraMeta = createSelector([selectSlice], (s) => s.pagination);