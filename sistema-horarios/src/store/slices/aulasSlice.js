import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import aulaService from '../../services/aulaService.js';

export const fetchAulas = createAsyncThunk(
    'aulas/fetch',
    async ({ page = 1, per_page = 15 } = {}, { rejectWithValue }) => {
        try {
            const response = await aulaService.getAulas({ page, per_page });

            if (response.success) {
                return {
                    rows: response.data.data,
                    meta: {
                        current_page: response.meta.current_page,
                        last_page: response.meta.last_page,
                        total: response.meta.total,
                        per_page: response.meta.per_page
                    },
                    page
                };
            } else {
                return rejectWithValue(response.message || 'Error al obtener aulas');
            }
        } catch (error) {
            return rejectWithValue(error.message || 'Error de conexión');
        }
    }
);

export const createAula = createAsyncThunk(
    'aulas/create',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await aulaService.create(payload);
            return response.data;
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Error al crear aula',
                errors: error.response?.data?.errors || null
            });
        }
    }
);

export const updateAula = createAsyncThunk(
    'aulas/update',
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await aulaService.update(id, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Error al actualizar aula',
                errors: error.response?.data?.errors || null
            });
        }
    }
);

export const deleteAula = createAsyncThunk(
    'aulas/delete',
    async (id, { rejectWithValue }) => {
        try {
            await aulaService.remove(id);
            return id;
        } catch (error) {
            const status = error.response?.status;
            return rejectWithValue({
                message: error.message || 'Error al eliminar aula',
                status
            });
        }
    }
);

const initialState = {
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, total: 0, per_page: 15, last_page: 1 },
    saving: false,
    saveError: null,
    lastDeleteError: null,
};

const aulasSlice = createSlice({
    name: 'aulas',
    initialState,
    reducers: {
        clearAulasError: (state) => { state.error = null; },
        clearAulasSaveError: (state) => { state.saveError = null; },
        clearAulasDeleteError: (state) => { state.lastDeleteError = null; },
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchAulas.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAulas.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.rows;
                state.pagination = {
                    page: action.payload.page,
                    total: action.payload.meta.total,
                    per_page: action.payload.meta.per_page,
                    last_page: action.payload.meta.last_page
                };
            })
            .addCase(fetchAulas.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Error al cargar aulas';
            })

            // Create
            .addCase(createAula.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(createAula.fulfilled, (state, action) => {
                state.saving = false;
                const created = action.payload;
                if (created && created.id) {
                    state.data = [created, ...state.data];
                    state.pagination.total += 1;
                }
            })
            .addCase(createAula.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || { message: 'Error al crear aula' };
            })

            // Update
            .addCase(updateAula.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(updateAula.fulfilled, (state, action) => {
                state.saving = false;
                const updated = action.payload;
                if (updated && updated.id) {
                    state.data = state.data.map((it) =>
                        it.id === updated.id ? { ...it, ...updated } : it
                    );
                }
            })
            .addCase(updateAula.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || { message: 'Error al actualizar aula' };
            })

            // Delete
            .addCase(deleteAula.pending, (state) => {
                state.saving = true;
                state.lastDeleteError = null;
            })
            .addCase(deleteAula.fulfilled, (state, action) => {
                state.saving = false;
                const id = action.payload;
                state.data = state.data.filter((it) => it.id !== id);
                state.pagination.total = Math.max(0, state.pagination.total - 1);
            })
            .addCase(deleteAula.rejected, (state, action) => {
                state.saving = false;
                state.lastDeleteError = action.payload || { message: 'Error al eliminar aula' };
            });
    }
});

export const {
    clearAulasError,
    clearAulasSaveError,
    clearAulasDeleteError
} = aulasSlice.actions;

export default aulasSlice.reducer;

// Selectores
const selectSlice = (state) => state.aulas;
export const selectAulas = createSelector([selectSlice], (s) => s.data);
export const selectAulasLoading = createSelector([selectSlice], (s) => s.loading);
export const selectAulasError = createSelector([selectSlice], (s) => s.error);
export const selectAulasMeta = createSelector([selectSlice], (s) => s.pagination);
export const selectAulasSaving = createSelector([selectSlice], (s) => s.saving);
export const selectAulasSaveError = createSelector([selectSlice], (s) => s.saveError);
export const selectAulasDeleteError = createSelector([selectSlice], (s) => s.lastDeleteError);