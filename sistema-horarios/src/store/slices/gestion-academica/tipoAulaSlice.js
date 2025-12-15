import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tipoAulaService from '../../../services/gestion-academica/tipoAulaService.js';

export const fetchTiposAula = createAsyncThunk(
  'tipoAula/fetch',
  async ({ page = 1, per_page = 15, activo } = {}, { rejectWithValue }) => {
    try {
      const params = { page, per_page };
      if (activo !== undefined) params.activo = activo;
      const { data } = await tipoAulaService.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createTipoAula = createAsyncThunk(
  'tipoAula/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await tipoAulaService.create(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || err.message);
    }
  }
);

export const updateTipoAula = createAsyncThunk(
  'tipoAula/update',
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const { data } = await tipoAulaService.update(id, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || err.message);
    }
  }
);

export const deleteTipoAula = createAsyncThunk(
  'tipoAula/delete',
  async (id, { rejectWithValue }) => {
    try {
      await tipoAulaService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const slice = createSlice({
  name: 'tipoAula',
  initialState: {
    items: [],
    pagination: { current_page: 0, last_page: 1, per_page: 15, total: 0 },
    loading: false,
    error: null,
    saving: false,
    deleting: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTiposAula.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTiposAula.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.data?.data || payload.data || payload;
        state.pagination = payload.data?.meta ?? payload.meta ?? payload.pagination ?? state.pagination;
      })
      .addCase(fetchTiposAula.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'Error al cargar tipos de aula';
      })
      .addCase(createTipoAula.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(createTipoAula.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.items.unshift(payload);
      })
      .addCase(createTipoAula.rejected, (state, { payload }) => {
        state.saving = false;
        state.error = payload || 'Error al crear tipo de aula';
      })
      .addCase(updateTipoAula.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateTipoAula.fulfilled, (state, { payload }) => {
        state.saving = false;
        const index = state.items.findIndex((item) => item.id === payload.id);
        if (index >= 0) state.items[index] = payload;
      })
      .addCase(updateTipoAula.rejected, (state, { payload }) => {
        state.saving = false;
        state.error = payload || 'Error al actualizar tipo de aula';
      })
      .addCase(deleteTipoAula.pending, (state) => { state.deleting = true; state.error = null; })
      .addCase(deleteTipoAula.fulfilled, (state, { payload }) => {
        state.deleting = false;
        state.items = state.items.filter((item) => item.id !== payload);
      })
      .addCase(deleteTipoAula.rejected, (state, { payload }) => {
        state.deleting = false;
        state.error = payload || 'Error al eliminar tipo de aula';
      });
  },
});

export const selectTipoAulaSlice = (state) => state.tipoAula;
export const selectTiposAula = (state) => state.tipoAula.items;
export const selectTiposAulaLoading = (state) => state.tipoAula.loading;
export const selectTiposAulaError = (state) => state.tipoAula.error;
export const selectTiposAulaPagination = (state) => state.tipoAula.pagination;
export default slice.reducer;
