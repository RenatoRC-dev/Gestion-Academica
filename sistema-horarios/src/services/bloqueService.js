// src/services/bloqueService.js
import api from './api.js';

const bloqueService = {
    getAll: async (params = {}) => {
        const { data } = await api.get('/bloques-horarios', { params });
        return Array.isArray(data) ? data : (data?.data ?? data);
    },

    getById: async (id) => {
        const { data } = await api.get(`/bloques-horarios/${id}`);
        return data;
    },

    create: async (payload) => {
        const { data } = await api.post('/bloques-horarios', payload);
        return data;
    },

    update: async (id, payload) => {
        const { data } = await api.put(`/bloques-horarios/${id}`, payload);
        return data;
    },

    remove: async (id) => {
        await api.delete(`/bloques-horarios/${id}`);
    },
};

export default bloqueService;