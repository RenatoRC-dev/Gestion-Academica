import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import metricasService from '../services/reportes/metricasService.js';

export const fetchMetricas = createAsyncThunk(
  'metricas/fetchMetricas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await metricasService.obtenerMetricasGenerales();
      return response;
    } catch (error) {
      console.error('Error en fetchMetricas:', error);
      return rejectWithValue(error.response?.data || { mensaje: 'Error al obtener métricas' });
    }
  }
);

const initialState = {
  data: {
    total_docentes: 0,
    total_materias: 0,
    total_aulas: 0,
    total_grupos: 0,
    total_periodos: 0,
    total_usuarios: 0
  },
  loading: false,
  error: null
};

const metricasSlice = createSlice({
  name: 'metricas',
  initialState,
  reducers: {
    resetMetricas: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetricas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetricas.fulfilled, (state, action) => {
        state.loading = false;
        state.data = {
          ...initialState.data,
          ...action.payload
        };
      })
      .addCase(fetchMetricas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetMetricas } = metricasSlice.actions;
export default metricasSlice.reducer;