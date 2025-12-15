import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import horarioService from '../../../services/gestion-horarios/horarioService.js';

export const fetchHorarios = createAsyncThunk(
    'horarios/fetch',
    async ({ page = 1, filtro = 'todos', valor = '' } = {}, { rejectWithValue }) => {
        try {
            const id = Number(valor || 0);
            let resp;

            if (filtro === 'docente' && id) {
                resp = await horarioService.horariosPorDocente(id, { page });
            } else if (filtro === 'aula' && id) {
                resp = await horarioService.horariosPorAula(id, { page });
            } else if (filtro === 'grupo' && id) {
                resp = await horarioService.horariosPorGrupo(id, { page });
            } else if (filtro === 'periodo' && id) {
                resp = await horarioService.horariosPorPeriodo(id, { page });
            } else {
                resp = await horarioService.listarHorarios({ page });
            }

            return { rows: resp.rows, meta: resp.meta, filtro, valor };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

export const fetchHorario = createAsyncThunk(
    'horarios/fetchOne',
    async (id, { rejectWithValue }) => {
        try {
            const h = await horarioService.obtenerHorario(id);
            return h;
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

export const updateHorario = createAsyncThunk(
    'horarios/update',
    async ({ id, changes }, { rejectWithValue }) => {
        try {
            const h = await horarioService.actualizarHorario(id, changes);
            return h;
        } catch (e) {
            const payload = {
                status: e?.response?.status,
                message: e?.response?.data?.message || e.message,
                conflictos: e?.response?.data?.conflictos,
            };
            return rejectWithValue(payload);
        }
    }
);

export const deleteHorario = createAsyncThunk(
    'horarios/delete',
    async (id, { rejectWithValue }) => {
        try {
            await horarioService.eliminarHorario(id);
            return id;
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

export const generarHorariosThunk = createAsyncThunk(
    'horarios/generar',
    async ({ periodo_id }, { rejectWithValue }) => {
        try {
            const res = await horarioService.generarHorarios({ periodo_id });
            return res;
        } catch (e) {
            const payload = {
                status: e?.response?.status,
                message: e?.response?.data?.message || e.message,
                conflictos: e?.response?.data?.conflictos,
            };
            return rejectWithValue(payload);
        }
    }
);

const slice = createSlice({
    name: 'horarios',
    initialState: {
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 15 },
        loading: false,
        error: null,

        filtro: 'todos',
        valor: '',

        one: null,
        oneLoading: false,
        oneError: null,

        saving: false,
        saveError: null,
        lastConflictos: null,

        deleting: false,
        deleteError: null,

        generating: false,
        generateError: null,
        lastGenerateResult: null,
    },
    reducers: {
        clearHorariosError: (s) => { s.error = null; },
        clearHorarioSaveError: (s) => { s.saveError = null; s.lastConflictos = null; },
        clearHorarioDeleteError: (s) => { s.deleteError = null; },
        clearGenerateInfo: (s) => { s.generateError = null; s.lastGenerateResult = null; },
    },
    extraReducers: (b) => {
        b // list
            .addCase(fetchHorarios.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchHorarios.fulfilled, (s, a) => {
                s.loading = false;
                s.data = a.payload.rows || [];
                s.meta = a.payload.meta || s.meta;
                s.filtro = a.payload.filtro;
                s.valor = a.payload.valor;
            })
            .addCase(fetchHorarios.rejected, (s, a) => { s.loading = false; s.error = a.payload || 'Error al cargar horarios'; })

            // one
            .addCase(fetchHorario.pending, (s) => { s.oneLoading = true; s.oneError = null; s.one = null; })
            .addCase(fetchHorario.fulfilled, (s, a) => { s.oneLoading = false; s.one = a.payload; })
            .addCase(fetchHorario.rejected, (s, a) => { s.oneLoading = false; s.oneError = a.payload || 'No se pudo cargar el horario'; })

            // update
            .addCase(updateHorario.pending, (s) => { s.saving = true; s.saveError = null; s.lastConflictos = null; })
            .addCase(updateHorario.fulfilled, (s, a) => {
                s.saving = false;
                const up = a.payload;
                const i = s.data.findIndex(x => x.id === up.id);
                if (i >= 0) s.data[i] = { ...s.data[i], ...up };
                s.one = up;
            })
            .addCase(updateHorario.rejected, (s, a) => {
                s.saving = false;
                s.saveError = a.payload?.message || 'No se pudo actualizar horario';
                s.lastConflictos = a.payload?.conflictos || null;
            })

            // delete
            .addCase(deleteHorario.pending, (s) => { s.deleting = true; s.deleteError = null; })
            .addCase(deleteHorario.fulfilled, (s, a) => {
                s.deleting = false;
                s.data = s.data.filter(x => x.id !== a.payload);
                s.meta.total = Math.max(0, (s.meta.total || 0) - 1);
            })
            .addCase(deleteHorario.rejected, (s, a) => { s.deleting = false; s.deleteError = a.payload || 'No se pudo eliminar'; })

            // generar
            .addCase(generarHorariosThunk.pending, (s) => { s.generating = true; s.generateError = null; s.lastGenerateResult = null; })
            .addCase(generarHorariosThunk.fulfilled, (s, a) => { s.generating = false; s.lastGenerateResult = a.payload; })
            .addCase(generarHorariosThunk.rejected, (s, a) => {
                s.generating = false;
                s.generateError = a.payload?.message || 'No se pudo generar';
                s.lastGenerateResult = a.payload?.conflictos ? { conflictos: a.payload.conflictos } : null;
            });
    }
});

export const {
    clearHorariosError, clearHorarioSaveError, clearHorarioDeleteError, clearGenerateInfo
} = slice.actions;

export default slice.reducer;

// Selectores
const selectSlice = (st) => st.horarios;
export const selectHorarios = createSelector([selectSlice], (s) => s.data);
export const selectHorariosMeta = createSelector([selectSlice], (s) => s.meta);
export const selectHorariosLoading = createSelector([selectSlice], (s) => s.loading);
export const selectHorariosError = createSelector([selectSlice], (s) => s.error);

export const selectHorario = createSelector([selectSlice], (s) => s.one);
export const selectHorarioLoading = createSelector([selectSlice], (s) => s.oneLoading);
export const selectHorarioError = createSelector([selectSlice], (s) => s.oneError);

export const selectHorarioSaving = createSelector([selectSlice], (s) => s.saving);
export const selectHorarioSaveError = createSelector([selectSlice], (s) => s.saveError);
export const selectHorarioConflictos = createSelector([selectSlice], (s) => s.lastConflictos);

export const selectHorarioDeleting = createSelector([selectSlice], (s) => s.deleting);
export const selectHorarioDeleteError = createSelector([selectSlice], (s) => s.deleteError);

export const selectGenerating = createSelector([selectSlice], (s) => s.generating);
export const selectGenerateError = createSelector([selectSlice], (s) => s.generateError);
export const selectLastGenerateResult = createSelector([selectSlice], (s) => s.lastGenerateResult);