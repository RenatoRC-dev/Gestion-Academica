import api from './api.js';

const usuarioService = {
    getAll: async (filters = {}) => {
        const response = await api.get('/usuarios', { params: filters });
        return response.data;
    },

    getUsuarios: async (filters = {}) => {
        const response = await api.get('/usuarios', { params: filters });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/usuarios/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/usuarios', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.patch(`/usuarios/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/usuarios/${id}`);
    },
};

export default usuarioService;