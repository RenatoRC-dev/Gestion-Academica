import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import grupoService from '../../../services/gestion-academica/grupoService.js';

export const fetchGrupos = createAsyncThunk(
    'grupos/fetch',
    async ({ page = 1, per_page = 15 } = {}, { rejectWithValue }) => {
        try {
            const response = await grupoService.getGrupos({ page, per_page });

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
                return rejectWithValue(response.message || 'Error al obtener grupos');
            }
        } catch (error) {
            return rejectWithValue(error.message || 'Error de conexión');
        }
    }
);

export const createGrupo = createAsyncThunk(
    'grupos/create',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await grupoService.create(payload);
            return response.data;
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Error al crear grupo',
                errors: error.response?.data?.errors || null
            });
        }
    }
);

export const updateGrupo = createAsyncThunk(
    'grupos/update',
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await grupoService.update(id, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Error al actualizar grupo',
                errors: error.response?.data?.errors || null
            });
        }
    }
);

export const deleteGrupo = createAsyncThunk(
    'grupos/delete',
    async (id, { rejectWithValue }) => {
        try {
            await grupoService.remove(id);
            return id;
        } catch (error) {
            const status = error.response?.status;
            return rejectWithValue({
                message: error.message || 'Error al eliminar grupo',
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

const gruposSlice = createSlice({
    name: 'grupos',
    initialState,
    reducers: {
        clearGruposError: (state) => { state.error = null; },
        clearGruposSaveError: (state) => { state.saveError = null; },
        clearGruposDeleteError: (state) => { state.lastDeleteError = null; },
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchGrupos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGrupos.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.rows;
                state.pagination = {
                    page: action.payload.page,
                    total: action.payload.meta.total,
                    per_page: action.payload.meta.per_page,
                    last_page: action.payload.meta.last_page
                };
            })
            .addCase(fetchGrupos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Error al cargar grupos';
            })

            // Create
            .addCase(createGrupo.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(createGrupo.fulfilled, (state, action) => {
                state.saving = false;
                const created = action.payload;
                if (created && created.id) {
                    state.data = [created, ...state.data];
                    state.pagination.total += 1;
                }
            })
            .addCase(createGrupo.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || { message: 'Error al crear grupo' };
            })

            // Update
            .addCase(updateGrupo.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(updateGrupo.fulfilled, (state, action) => {
                state.saving = false;
                const updated = action.payload;
                if (updated && updated.id) {
                    state.data = state.data.map((it) =>
                        it.id === updated.id ? { ...it, ...updated } : it
                    );
                }
            })
            .addCase(updateGrupo.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || { message: 'Error al actualizar grupo' };
            })

            // Delete
            .addCase(deleteGrupo.pending, (state) => {
                state.saving = true;
                state.lastDeleteError = null;
            })
            .addCase(deleteGrupo.fulfilled, (state, action) => {
                state.saving = false;
                const id = action.payload;
                state.data = state.data.filter((it) => it.id !== id);
                state.pagination.total = Math.max(0, state.pagination.total - 1);
            })
            .addCase(deleteGrupo.rejected, (state, action) => {
                state.saving = false;
                state.lastDeleteError = action.payload || { message: 'Error al eliminar grupo' };
            });
    }
});

export const {
    clearGruposError,
    clearGruposSaveError,
    clearGruposDeleteError
} = gruposSlice.actions;

export default gruposSlice.reducer;

// Selectores
const selectSlice = (state) => state.grupos;
export const selectGrupos = createSelector([selectSlice], (s) => s.data);
export const selectGruposLoading = createSelector([selectSlice], (s) => s.loading);
export const selectGruposError = createSelector([selectSlice], (s) => s.error);
export const selectGruposMeta = createSelector([selectSlice], (s) => s.pagination);
export const selectGruposSaving = createSelector([selectSlice], (s) => s.saving);
export const selectGruposSaveError = createSelector([selectSlice], (s) => s.saveError);
export const selectGruposDeleteError = createSelector([selectSlice], (s) => s.lastDeleteError);