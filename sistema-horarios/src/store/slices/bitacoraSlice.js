// src/slices/bitacoraSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api.js';

// LIST
export const fetchBitacora = createAsyncThunk('bitacora/fetch', async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
        const resp = await api.get('/bitacora', { params: { page, per_page: 15 } });

        // La respuesta viene como: { success: true, data: { data: [], current_page, last_page, total, per_page } }
        const paginatedData = resp?.data?.data ?? {};
        const rows = Array.isArray(paginatedData?.data) ? paginatedData.data : (Array.isArray(paginatedData) ? paginatedData : []);

        const meta = {
            current_page: paginatedData?.current_page ?? 1,
            last_page: paginatedData?.last_page ?? 1,
            total: paginatedData?.total ?? rows.length,
            per_page: paginatedData?.per_page ?? 15,
        };

        return { rows, meta, page };
    } catch (e) {
        console.error('Error fetching bitacora:', e);
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