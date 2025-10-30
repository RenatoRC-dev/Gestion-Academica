import api from './api.js';

const periodoService = {
    getPeriodos: async (params = {}) => {
        try {
            const response = await api.get('/periodos', {
                params: {
                    ...params,
                    per_page: params.per_page || 15
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching periodos:', error);
            return {
                data: [],
                meta: { total: 0, current_page: 1, per_page: params.per_page || 15 }
            };
        }
    },

    getAll: async (filters = {}) => {
        const response = await api.get('/periodos', {
            params: {
                ...filters,
                per_page: filters.per_page || 50
            }
        });
        return response.data?.data || [];
    },

    getById: async (id) => {
        const response = await api.get(`/periodos/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/periodos', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.patch(`/periodos/${id}`, data);
        return response.data;
    },

    remove: async (id) => {
        await api.delete(`/periodos/${id}`);
        return true;
    }
};

export default periodoService;