import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import materiaService from '../../services/materiaService.js';

export const fetchMaterias = createAsyncThunk(
    'materias/fetch',
    async ({ page = 1, per_page = 15 } = {}, { rejectWithValue }) => {
        try {
            const response = await materiaService.getMaterias({ page, per_page });

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
                return rejectWithValue(response.message || 'Error al obtener materias');
            }
        } catch (error) {
            return rejectWithValue(error.message || 'Error de conexión');
        }
    }
);

export const createMateria = createAsyncThunk(
    'materias/create',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await materiaService.create(payload);
            return response.data;
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Error al crear materia',
                errors: error.response?.data?.errors || null
            });
        }
    }
);

export const updateMateria = createAsyncThunk(
    'materias/update',
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await materiaService.update(id, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Error al actualizar materia',
                errors: error.response?.data?.errors || null
            });
        }
    }
);

export const deleteMateria = createAsyncThunk(
    'materias/delete',
    async (id, { rejectWithValue }) => {
        try {
            await materiaService.remove(id);
            return id;
        } catch (error) {
            const status = error.response?.status;
            return rejectWithValue({
                message: error.message || 'Error al eliminar materia',
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

const materiasSlice = createSlice({
    name: 'materias',
    initialState,
    reducers: {
        clearMateriasError: (state) => { state.error = null; },
        clearMateriasSaveError: (state) => { state.saveError = null; },
        clearMateriasDeleteError: (state) => { state.lastDeleteError = null; },
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchMaterias.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMaterias.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.rows;
                state.pagination = {
                    page: action.payload.page,
                    total: action.payload.meta.total,
                    per_page: action.payload.meta.per_page,
                    last_page: action.payload.meta.last_page
                };
            })
            .addCase(fetchMaterias.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Error al cargar materias';
            })

            // Create
            .addCase(createMateria.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(createMateria.fulfilled, (state, action) => {
                state.saving = false;
                const created = action.payload;
                if (created && created.id) {
                    state.data = [created, ...state.data];
                    state.pagination.total += 1;
                }
            })
            .addCase(createMateria.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || { message: 'Error al crear materia' };
            })

            // Update
            .addCase(updateMateria.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(updateMateria.fulfilled, (state, action) => {
                state.saving = false;
                const updated = action.payload;
                if (updated && updated.id) {
                    state.data = state.data.map((it) =>
                        it.id === updated.id ? { ...it, ...updated } : it
                    );
                }
            })
            .addCase(updateMateria.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || { message: 'Error al actualizar materia' };
            })

            // Delete
            .addCase(deleteMateria.pending, (state) => {
                state.saving = true;
                state.lastDeleteError = null;
            })
            .addCase(deleteMateria.fulfilled, (state, action) => {
                state.saving = false;
                const id = action.payload;
                state.data = state.data.filter((it) => it.id !== id);
                state.pagination.total = Math.max(0, state.pagination.total - 1);
            })
            .addCase(deleteMateria.rejected, (state, action) => {
                state.saving = false;
                state.lastDeleteError = action.payload || { message: 'Error al eliminar materia' };
            });
    }
});

export const {
    clearMateriasError,
    clearMateriasSaveError,
    clearMateriasDeleteError
} = materiasSlice.actions;

export default materiasSlice.reducer;

// Selectores
const selectSlice = (state) => state.materias;
export const selectMaterias = createSelector([selectSlice], (s) => s.data);
export const selectMateriasLoading = createSelector([selectSlice], (s) => s.loading);
export const selectMateriasError = createSelector([selectSlice], (s) => s.error);
export const selectMateriasMeta = createSelector([selectSlice], (s) => s.pagination);
export const selectMateriasSaving = createSelector([selectSlice], (s) => s.saving);
export const selectMateriasSaveError = createSelector([selectSlice], (s) => s.saveError);
export const selectMateriasDeleteError = createSelector([selectSlice], (s) => s.lastDeleteError);
