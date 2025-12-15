import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import docenteService from '../../../services/gestion-academica/docenteService.js';

const mapDocente = (d) => ({
    id: d.id,
    codigo_docente: d.codigo_docente,
    persona: {
        id: d.persona?.id,
        nombre_completo: d.persona?.nombre_completo,
        ci: d.persona?.ci,
        telefono_contacto: d.persona?.telefono_contacto || '',
        direccion: d.persona?.direccion || '',
        usuario: {
            id: d.persona?.usuario?.id,
            email: d.persona?.usuario?.email,
            activo: d.persona?.usuario?.activo
        }
    },
    created_at: d.created_at,
    updated_at: d.updated_at
});

export const fetchDocentes = createAsyncThunk(
    'docentes/fetch',
    async ({ page = 1, per_page = 15 } = {}, { rejectWithValue }) => {
        try {
            const response = await docenteService.getDocentes({ page, per_page });

            if (response.success) {
                return {
                    items: response.data.data.map(mapDocente),
                    pagination: {
                        current_page: response.meta.current_page,
                        last_page: response.meta.last_page,
                        per_page: response.meta.per_page,
                        total: response.meta.total
                    }
                };
            } else {
                return rejectWithValue(response.message || 'Error al obtener docentes');
            }
        } catch (error) {
            return rejectWithValue(error.message || 'Error de conexión');
        }
    }
);

export const createDocente = createAsyncThunk(
    'docentes/create',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await docenteService.create(payload);
            return { docente: mapDocente(response.data) };
        } catch (error) {
            return rejectWithValue(error.message || 'Error al crear docente');
        }
    }
);

export const updateDocente = createAsyncThunk(
    'docentes/update',
    async ({ id, changes }, { rejectWithValue }) => {
        try {
            const response = await docenteService.update(id, changes);
            return mapDocente(response.data);
        } catch (error) {
            return rejectWithValue(error.message || 'Error al actualizar docente');
        }
    }
);

export const deleteDocente = createAsyncThunk(
    'docentes/delete',
    async (id, { rejectWithValue }) => {
        try {
            await docenteService.remove(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.message || 'Error al eliminar docente');
        }
    }
);

const docentesSlice = createSlice({
    name: 'docentes',
    initialState: {
        items: [],
        pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        loading: false,
        error: null,
        creating: false,
        updating: false,
        deleting: false,
    },
    reducers: {
        clearError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDocentes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDocentes.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.items;
                state.pagination = payload.pagination;
            })
            .addCase(fetchDocentes.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload || 'Error';
            })

            .addCase(createDocente.pending, (state) => {
                state.creating = true;
                state.error = null;
            })
            .addCase(createDocente.fulfilled, (state, { payload }) => {
                state.creating = false;
                state.items.unshift(payload.docente);
            })
            .addCase(createDocente.rejected, (state, { payload }) => {
                state.creating = false;
                state.error = payload || 'Error';
            })

            .addCase(updateDocente.pending, (state) => {
                state.updating = true;
                state.error = null;
            })
            .addCase(updateDocente.fulfilled, (state, { payload }) => {
                state.updating = false;
                const index = state.items.findIndex(x => x.id === payload.id);
                if (index >= 0) state.items[index] = payload;
            })
            .addCase(updateDocente.rejected, (state, { payload }) => {
                state.updating = false;
                state.error = payload || 'Error';
            })

            .addCase(deleteDocente.pending, (state) => {
                state.deleting = true;
                state.error = null;
            })
            .addCase(deleteDocente.fulfilled, (state, { payload: id }) => {
                state.deleting = false;
                state.items = state.items.filter(x => x.id !== id);
            })
            .addCase(deleteDocente.rejected, (state, { payload }) => {
                state.deleting = false;
                state.error = payload || 'Error';
            });
    }
});

export const { clearError } = docentesSlice.actions;
export default docentesSlice.reducer;