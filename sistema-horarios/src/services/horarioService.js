import api from './api.js';

const horarioService = {
    listarHorarios: async ({ page = 1, per_page = 15 } = {}) => {
        const resp = await api.get('/horarios', { params: { page, per_page } });
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
    }
};

export default horarioService;