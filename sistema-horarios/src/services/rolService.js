import api from './api.js';

const rolService = {
    getAll: async (filters = {}) => {
        const response = await api.get('/roles', { params: filters });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/roles/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/roles', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.patch(`/roles/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/roles/${id}`);
    },
};