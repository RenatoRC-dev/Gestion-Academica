import api from './api.js';

const estadoAsistenciaService = {
    getAll: async (params = {}) => {
        const { data } = await api.get('/estados-asistencia', { params });
        return data;
    },

    getById: async (id) => {
        const { data } = await api.get(`/estados-asistencia/${id}`);
        return data;
    },

    create: async (payload) => {
        const { data } = await api.post('/estados-asistencia', payload);
        return data;
    },

    update: async (id, payload) => {
        const { data } = await api.put(`/estados-asistencia/${id}`, payload);
        return data;
    },

    remove: async (id) => {
        await api.delete(`/estados-asistencia/${id}`);
    },
};

export default estadoAsistenciaService;
