import api from '../api.js';

const horarioService = {
    listarHorarios: async ({ page = 1, per_page = 15, search = '', docente_id = '', grupo_id = '', materia_id = '', pattern = '', periodo_id = '', activo = '' } = {}) => {
        const params = { page, per_page };
        if (search) params.search = search;
        if (docente_id) params.docente_id = docente_id;
        if (grupo_id) params.grupo_id = grupo_id;
        if (materia_id) params.materia_id = materia_id;
        if (pattern) params.pattern = pattern;
        if (periodo_id) params.periodo_id = periodo_id;
        if (activo !== '') params.activo = activo;
        const resp = await api.get('/horarios', { params });
        const p = resp?.data?.data ?? {};
        return {
            rows: Array.isArray(p?.data) ? p.data : [],
            meta: {
                current_page: p?.current_page ?? 1,
                last_page: p?.last_page ?? 1,
                total: p?.total ?? 0,
                per_page: p?.per_page ?? 15,
            },
        };
    },

    obtenerHorario: async (id) => {
        const resp = await api.get(`/horarios/${id}`);
        return resp?.data?.data ?? resp?.data;
    },

    actualizarHorario: async (id, payload) => {
        const resp = await api.put(`/horarios/${id}`, payload);
        return resp?.data?.data ?? resp?.data;
    },

    eliminarHorario: async (id) => {
        const resp = await api.delete(`/horarios/${id}`);
        return resp?.data ?? { success: true };
    },

    generarHorarios: async ({ periodo_id }) => {
        const resp = await api.post('/horarios/generar', { periodo_id });
        return resp?.data?.data ?? resp?.data;
    },

    horariosPorDocente: async (docenteId, { page = 1 } = {}) => {
        const resp = await api.get(`/horarios/docente/${docenteId}`, { params: { page } });
        const p = resp?.data?.data ?? {};
        return {
            rows: Array.isArray(p?.data) ? p.data : [],
            meta: {
                current_page: p?.current_page ?? 1,
                last_page: p?.last_page ?? 1,
                total: p?.total ?? 0,
                per_page: p?.per_page ?? 15
            }
        };
    },

    horariosPorAula: async (aulaId, { page = 1 } = {}) => {
        const resp = await api.get(`/horarios/aula/${aulaId}`, { params: { page } });
        const p = resp?.data?.data ?? {};
        return {
            rows: Array.isArray(p?.data) ? p.data : [],
            meta: {
                current_page: p?.current_page ?? 1,
                last_page: p?.last_page ?? 1,
                total: p?.total ?? 0,
                per_page: p?.per_page ?? 15
            }
        };
    },

    horariosPorGrupo: async (grupoId, { page = 1 } = {}) => {
        const resp = await api.get(`/horarios/grupo/${grupoId}`, { params: { page } });
        const p = resp?.data?.data ?? {};
        return {
            rows: Array.isArray(p?.data) ? p.data : [],
            meta: {
                current_page: p?.current_page ?? 1,
                last_page: p?.last_page ?? 1,
                total: p?.total ?? 0,
                per_page: p?.per_page ?? 15
            }
        };
    },

    horariosPorPeriodo: async (periodoId, { page = 1 } = {}) => {
        const resp = await api.get(`/horarios/periodo/${periodoId}`, { params: { page } });
        const p = resp?.data?.data ?? {};
        return {
            rows: Array.isArray(p?.data) ? p.data : [],
            meta: {
                current_page: p?.current_page ?? 1,
                last_page: p?.last_page ?? 1,
                total: p?.total ?? 0,
                per_page: p?.per_page ?? 15
            }
        };
    },

    obtenerCalendario: async (horarioId) => {
        const resp = await api.get(`/horarios/${horarioId}/calendario`);
        return resp?.data?.data ?? [];
    },

    calendarioDocente: async () => {
        const resp = await api.get('/horarios/calendario-docente');
        const data = resp?.data?.data;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.agenda)) return data.agenda;
        return [];
    },

    obtenerVirtualesDocente: async () => {
        const resp = await api.get('/horarios/virtuales-docente');
        return resp?.data?.data ?? [];
    }
};

export default horarioService;
