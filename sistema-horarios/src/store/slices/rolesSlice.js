// src/slices/rolesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import rolService from '../../services/rolService.js';

const parsePaginator = (resp) => {
    const payload = resp?.data ?? resp ?? {};
    const container = payload?.data ?? payload;
    const rows =
        Array.isArray(container?.data) ?
            container.data :
            Array.isArray(container) ? container : [];
    const metaSource = container?.meta ?? payload?.meta ?? container;
    const meta = {
        current_page: metaSource?.current_page ?? 1,
        last_page: metaSource?.last_page ?? 1,
        total: metaSource?.total ?? rows.length,
        per_page: metaSource?.per_page ?? (rows.length || 15),
    };
    return { rows, meta };
};

export const fetchRoles = createAsyncThunk(
    'roles/fetch',
    async ({ page = 1 } = {}, { rejectWithValue }) => {
        try {
            const resp = await rolService.getAll({ page });
            const { rows, meta } = parsePaginator(resp);
            return { rows, meta, page };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

export const createRole = createAsyncThunk(
    'roles/create',
    async (payload, { rejectWithValue }) => {
        try {
            const resp = await rolService.create(payload);
            return resp?.data || resp;
        } catch (e) {
            return rejectWithValue({
                message: e?.response?.data?.message || e.message,
                errors: e?.response?.data?.errors || null,
            });
        }
    }
);

export const updateRole = createAsyncThunk(
    'roles/update',
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const resp = await rolService.update(id, payload);
            return resp?.data || resp;
        } catch (e) {
            return rejectWithValue({
                message: e?.response?.data?.message || e.message,
                errors: e?.response?.data?.errors || null,
            });
        }
    }
);

export const deleteRole = createAsyncThunk(
    'roles/delete',
    async (id, { rejectWithValue }) => {
        try {
            await rolService.delete(id);
            return id;
        } catch (e) {
            return rejectWithValue({
                message: e?.response?.data?.message || e.message,
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
    deleteError: null,
};

const rolesSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {
        clearRolesError: (s) => { s.error = null; },
        clearRolesSaveError: (s) => { s.saveError = null; },
    },
    extraReducers: (b) => {
        b.addCase(fetchRoles.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchRoles.fulfilled, (s, a) => {
                s.loading = false;
                s.data = a.payload.rows;
                s.pagination = { page: a.payload.page, ...a.payload.meta };
            })
            .addCase(fetchRoles.rejected, (s, a) => {
                s.loading = false; s.error = a.payload || 'Error al cargar roles';
            });

        b.addCase(createRole.pending, (s) => { s.saving = true; s.saveError = null; })
            .addCase(createRole.fulfilled, (s, a) => {
                s.saving = false;
                const created = a.payload?.data ?? a.payload;
                if (created?.id) {
                    s.data = [created, ...s.data];
                    s.pagination.total += 1;
                }
            })
            .addCase(createRole.rejected, (s, a) => {
                s.saving = false;
                s.saveError = a.payload || { message: 'Error al crear rol' };
            });

        b.addCase(updateRole.pending, (s) => { s.saving = true; s.saveError = null; })
            .addCase(updateRole.fulfilled, (s, a) => {
                s.saving = false;
                const updated = a.payload?.data ?? a.payload;
                if (updated?.id) {
                    s.data = s.data.map((it) => (it.id === updated.id ? { ...it, ...updated } : it));
                }
            })
            .addCase(updateRole.rejected, (s, a) => {
                s.saving = false;
                s.saveError = a.payload || { message: 'Error al actualizar rol' };
            });

        b.addCase(deleteRole.pending, (s) => { s.deleteError = null; })
            .addCase(deleteRole.fulfilled, (s, a) => {
                s.data = s.data.filter((it) => it.id !== a.payload);
                s.pagination.total = Math.max(0, s.pagination.total - 1);
            })
            .addCase(deleteRole.rejected, (s, a) => {
                s.deleteError = a.payload || { message: 'Error al eliminar rol' };
            });
    }
});

export const { clearRolesError, clearRolesSaveError } = rolesSlice.actions;
export default rolesSlice.reducer;

// Selectors
const selectSlice = (state) => state.roles;
export const selectRoles = createSelector([selectSlice], (s) => s.data);
export const selectRolesLoading = createSelector([selectSlice], (s) => s.loading);
export const selectRolesError = createSelector([selectSlice], (s) => s.error);
export const selectRolesMeta = createSelector([selectSlice], (s) => s.pagination);
export const selectRolesSaving = createSelector([selectSlice], (s) => s.saving);
export const selectRolesSaveError = createSelector([selectSlice], (s) => s.saveError);
export const selectRolesDeleteError = createSelector([selectSlice], (s) => s.deleteError);
