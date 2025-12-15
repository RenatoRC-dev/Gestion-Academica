import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api.js';

// Helpers
const mapPeriodo = (p) => ({
    id: p.id,
    nombre: p.nombre,
    fecha_inicio: p.fecha_inicio,
    fecha_fin: p.fecha_fin,
    activo: !!p.activo,
    created_at: p.created_at,
    updated_at: p.updated_at
});

// Thunks
export const fetchPeriodos = createAsyncThunk(
    'periodos/fetch',
    async ({ page = 1 } = {}, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/periodos?page=${page}`);
            if (!data?.success) throw new Error(data?.message || 'Error al obtener periodos');
            const payload = data.data; // paginator
            return {
                items: payload.data.map(mapPeriodo),
                pagination: {
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    per_page: payload.per_page,
                    total: payload.total,
                }
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const createPeriodo = createAsyncThunk(
    'periodos/create',
    async (payload, { rejectWithValue }) => {
        try {
            // Validación de fechas mínima en el front (el back ya valida)
            if (payload.fecha_inicio && payload.fecha_fin) {
                const ini = new Date(payload.fecha_inicio);
                const fin = new Date(payload.fecha_fin);
                if (isFinite(ini) && isFinite(fin) && fin < ini) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                }
            }
            const { data } = await api.post('/periodos', payload);
            if (!data?.success) throw new Error(data?.message || 'Error al crear período');
            return mapPeriodo(data.data);
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const updatePeriodo = createAsyncThunk(
    'periodos/update',
    async ({ id, changes }, { rejectWithValue }) => {
        try {
            if (changes.fecha_inicio && changes.fecha_fin) {
                const ini = new Date(changes.fecha_inicio);
                const fin = new Date(changes.fecha_fin);
                if (isFinite(ini) && isFinite(fin) && fin < ini) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                }
            }
            const { data } = await api.put(`/periodos/${id}`, changes);
            if (!data?.success) throw new Error(data?.message || 'Error al actualizar período');
            return mapPeriodo(data.data);
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const deletePeriodo = createAsyncThunk(
    'periodos/delete',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.delete(`/periodos/${id}`);
            if (!data?.success) throw new Error(data?.message || 'No se pudo eliminar el período');
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

const periodosSlice = createSlice({
    name: 'periodos',
    initialState: {
        items: [],
        pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        loading: false,
        error: null,
        creating: false,
        updating: false,
        deleting: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // fetch
            .addCase(fetchPeriodos.pending, (st) => { st.loading = true; st.error = null; })
            .addCase(fetchPeriodos.fulfilled, (st, { payload }) => {
                st.loading = false;
                st.items = payload.items;
                st.pagination = payload.pagination;
            })
            .addCase(fetchPeriodos.rejected, (st, { payload }) => {
                st.loading = false; st.error = payload || 'Error';
            })
            // create
            .addCase(createPeriodo.pending, (st) => { st.creating = true; st.error = null; })
            .addCase(createPeriodo.fulfilled, (st, { payload }) => {
                st.creating = false;
                st.items.unshift(payload);
            })
            .addCase(createPeriodo.rejected, (st, { payload }) => {
                st.creating = false; st.error = payload || 'Error';
            })
            // update
            .addCase(updatePeriodo.pending, (st) => { st.updating = true; st.error = null; })
            .addCase(updatePeriodo.fulfilled, (st, { payload }) => {
                st.updating = false;
                const i = st.items.findIndex(x => x.id === payload.id);
                if (i >= 0) st.items[i] = payload;
            })
            .addCase(updatePeriodo.rejected, (st, { payload }) => {
                st.updating = false; st.error = payload || 'Error';
            })
            // delete
            .addCase(deletePeriodo.pending, (st) => { st.deleting = true; st.error = null; })
            .addCase(deletePeriodo.fulfilled, (st, { payload: id }) => {
                st.deleting = false;
                st.items = st.items.filter(x => x.id !== id);
            })
            .addCase(deletePeriodo.rejected, (st, { payload }) => {
                st.deleting = false; st.error = payload || 'Error';
            });
    }
});

export default periodosSlice.reducer;

// Selector para obtener los períodos
export const selectPeriodos = (state) => state.periodos.items;
export const selectPeriodosLoading = (state) => state.periodos.loading;
export const selectPeriodosError = (state) => state.periodos.error;
export const selectPeriodosPagination = (state) => state.periodos.pagination;