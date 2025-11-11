import api from './api.js';

const metodoRegistroService = {
    getAll: async (params = {}) => {
        const { data } = await api.get('/metodos-registro', { params });
        return data;
    },

    getById: async (id) => {
        const { data } = await api.get(`/metodos-registro/${id}`);
        return data;
    },

    update: async (id, payload) => {
        const { data } = await api.put(`/metodos-registro/${id}`, payload);
        return data;
    },
};

export default metodoRegistroService;
