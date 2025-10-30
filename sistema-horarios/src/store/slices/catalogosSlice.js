// src/store/catalogosSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// Cada service debe exponer un "listar" paginado: { rows, meta }
import * as docenteSvc from '../../services/docenteService.js';
import * as aulaSvc from '../../services/aulaService.js';
import * as grupoSvc from '../../services/grupoService.js';
import * as bloqueSvc from '../../services/bloqueService.js';
import * as periodoSvc from '../../services/periodoService.js';
import * as materiaSvc from '../../services/materiaService.js';

// Helper que trae todas las páginas (tope de seguridad)
async function fetchAll(listFn, max = 2000) {
    let page = 1;
    let out = [];
    // intenta 50 páginas máx. o hasta llegar a "max" items
    for (let i = 0; i < 50; i++) {
        const r = await listFn({ page });
        const rows = r?.rows || r?.data || [];
        out = out.concat(rows);
        const meta = r?.meta || r?.pagination || {};
        if (!meta?.last_page || page >= meta.last_page || out.length >= max) break;
        page++;
    }
    return out;
}

export const loadCatalogosOnce = createAsyncThunk(
    'catalogos/loadOnce',
    async (_, { getState, rejectWithValue }) => {
        const st = getState();
        // si ya cargó, retorna cache para no repetir
        if (st.catalogos?.loaded) return {
            docentes: st.catalogos.docentes, aulas: st.catalogos.aulas,
            grupos: st.catalogos.grupos, bloques: st.catalogos.bloques,
            periodos: st.catalogos.periodos, materias: st.catalogos.materias
        };

        try {
            const [docentes, aulas, grupos, bloques, periodos, materias] = await Promise.all([
                fetchAll(docenteSvc.listarDocentes),
                fetchAll(aulaSvc.listarAulas),
                fetchAll(grupoSvc.listarGrupos),
                fetchAll(bloqueSvc.listarBloques),
                fetchAll(periodoSvc.listarPeriodos),
                fetchAll(materiaSvc.listarMaterias),
            ]);

            return { docentes, aulas, grupos, bloques, periodos, materias };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || e.message);
        }
    }
);

const slice = createSlice({
    name: 'catalogos',
    initialState: {
        docentes: [],
        aulas: [],
        grupos: [],
        bloques: [],
        periodos: [],
        materias: [],
        loading: false,
        error: null,
        loaded: false,
    },
    reducers: {
        clearCatalogosError: (s) => { s.error = null; }
    },
    extraReducers: (b) => {
        b.addCase(loadCatalogosOnce.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(loadCatalogosOnce.fulfilled, (s, a) => {
                s.loading = false; s.loaded = true;
                Object.assign(s, a.payload || {});
            })
            .addCase(loadCatalogosOnce.rejected, (s, a) => {
                s.loading = false; s.error = a.payload || 'Error al cargar catálogos';
            });
    }
});

export const { clearCatalogosError } = slice.actions;
export default slice.reducer;

// Selectores
const selectSlice = (st) => st.catalogos;
export const selectDocentes = createSelector([selectSlice], (s) => s.docentes);
export const selectAulas = createSelector([selectSlice], (s) => s.aulas);
export const selectGrupos = createSelector([selectSlice], (s) => s.grupos);
export const selectBloques = createSelector([selectSlice], (s) => s.bloques);
export const selectPeriodos = createSelector([selectSlice], (s) => s.periodos);
export const selectMaterias = createSelector([selectSlice], (s) => s.materias);
export const selectCatalogosLoading = createSelector([selectSlice], (s) => s.loading);
export const selectCatalogosLoaded = createSelector([selectSlice], (s) => s.loaded);
export const selectCatalogosError = createSelector([selectSlice], (s) => s.error);