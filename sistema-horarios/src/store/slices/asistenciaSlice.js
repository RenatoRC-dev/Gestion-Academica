import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import asistenciaService from '../../services/asistenciaService.js';

export const fetchAsistencias = createAsyncThunk(
    'asistencias/fetch',
    async ({ page = 1, per_page = 15 } = {}, { rejectWithValue }) => {
        try {
            const { rows, meta } = await asistenciaService.listarAsistencias({ page, per_page });
            return { rows, meta };
        } catch (error) {
            return rejectWithValue(error.message || 'Error al cargar asistencias');
        }
    }
);

export const fetchAsistencia = createAsyncThunk(
    'asistencias/fetchOne',
    async (id, { rejectWithValue }) => {
        try {
            const a = await asistenciaService.obtenerAsistencia(id);
            return a;
        } catch (error) {
            return rejectWithValue(error.message || 'No se pudo cargar');
        }
    }
);

export const generarQRThunk = createAsyncThunk(
    'asistencias/generarQR',
    async ({ horario_asignado_id }, { rejectWithValue }) => {
        try {
            const res = await asistenciaService.generarQR(horario_asignado_id);
            return res;
        } catch (error) {
            return rejectWithValue(error.message || 'No se pudo generar QR');
        }
    }
);

export const escanearQRThunk = createAsyncThunk(
    'asistencias/escanearQR',
    async ({ codigo_qr }, { rejectWithValue }) => {
        try {
            const res = await asistenciaService.escanearQR(codigo_qr);
            return res;
        } catch (error) {
            const status = error?.response?.status;
            return rejectWithValue({ status, message: error.message || 'Error al registrar' });
        }
    }
);

export const confirmarVirtualThunk = createAsyncThunk(
    'asistencias/confirmarVirtual',
    async ({ horario_asignado_id }, { rejectWithValue }) => {
        try {
            const res = await asistenciaService.confirmarAsistenciaVirtual(horario_asignado_id);
            return res;
        } catch (error) {
            const status = error?.response?.status;
            return rejectWithValue({ status, message: error.message || 'Error al confirmar' });
        }
    }
);

const slice = createSlice({
    name: 'asistencias',
    initialState: {
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 15 },
        loading: false,
        error: null,

        one: null,
        oneLoading: false,
        oneError: null,

        opLoading: false,
        opError: null,
        lastOpResult: null,
    },
    reducers: {
        clearAsistenciasError: (s) => { s.error = null; },
        clearAsistenciaOneError: (s) => { s.oneError = null; },
        clearAsistenciaOp: (s) => { s.opError = null; s.lastOpResult = null; },
    },
    extraReducers: (b) => {
        b // list
            .addCase(fetchAsistencias.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchAsistencias.fulfilled, (s, a) => {
                s.loading = false;
                s.data = a.payload.rows || [];
                s.meta = a.payload.meta || s.meta;
            })
            .addCase(fetchAsistencias.rejected, (s, a) => { s.loading = false; s.error = a.payload || 'Error al cargar asistencias'; })

            // detail
            .addCase(fetchAsistencia.pending, (s) => { s.oneLoading = true; s.oneError = null; s.one = null; })
            .addCase(fetchAsistencia.fulfilled, (s, a) => { s.oneLoading = false; s.one = a.payload; })
            .addCase(fetchAsistencia.rejected, (s, a) => { s.oneLoading = false; s.oneError = a.payload || 'No se pudo cargar'; })

            // generar QR
            .addCase(generarQRThunk.pending, (s) => { s.opLoading = true; s.opError = null; s.lastOpResult = null; })
            .addCase(generarQRThunk.fulfilled, (s, a) => { s.opLoading = false; s.lastOpResult = { type: 'generarQR', data: a.payload }; })
            .addCase(generarQRThunk.rejected, (s, a) => { s.opLoading = false; s.opError = a.payload || 'No se pudo generar QR'; })

            // escanear QR
            .addCase(escanearQRThunk.pending, (s) => { s.opLoading = true; s.opError = null; s.lastOpResult = null; })
            .addCase(escanearQRThunk.fulfilled, (s, a) => { s.opLoading = false; s.lastOpResult = { type: 'escanearQR', data: a.payload }; })
            .addCase(escanearQRThunk.rejected, (s, a) => { s.opLoading = false; s.opError = a.payload?.message || 'Error al registrar'; })

            // confirmar virtual
            .addCase(confirmarVirtualThunk.pending, (s) => { s.opLoading = true; s.opError = null; s.lastOpResult = null; })
            .addCase(confirmarVirtualThunk.fulfilled, (s, a) => { s.opLoading = false; s.lastOpResult = { type: 'confirmarVirtual', data: a.payload }; })
            .addCase(confirmarVirtualThunk.rejected, (s, a) => { s.opLoading = false; s.opError = a.payload?.message || 'Error al confirmar'; });
    }
});

export const { clearAsistenciasError, clearAsistenciaOneError, clearAsistenciaOp } = slice.actions;
export default slice.reducer;

// Selectores
const selectSlice = (st) => st.asistencias;
export const selectAsistencias = createSelector([selectSlice], (s) => s.data);
export const selectAsistenciasMeta = createSelector([selectSlice], (s) => s.meta);
export const selectAsistenciasLoading = createSelector([selectSlice], (s) => s.loading);
export const selectAsistenciasError = createSelector([selectSlice], (s) => s.error);

export const selectAsistencia = createSelector([selectSlice], (s) => s.one);
export const selectAsistenciaLoading = createSelector([selectSlice], (s) => s.oneLoading);
export const selectAsistenciaError = createSelector([selectSlice], (s) => s.oneError);

export const selectAsistenciaOpLoading = createSelector([selectSlice], (s) => s.opLoading);
export const selectAsistenciaOpError = createSelector([selectSlice], (s) => s.opError);
export const selectAsistenciaLastOp = createSelector([selectSlice], (s) => s.lastOpResult);