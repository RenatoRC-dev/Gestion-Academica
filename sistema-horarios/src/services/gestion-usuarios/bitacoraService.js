import api from '../api.js';

const bitacoraService = {
    getBitacora: async (params = {}) => {
        try {
            const response = await api.get('/bitacora', {
                params: {
                    ...params,
                    per_page: params.per_page || 10
                }
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data || [],
                    meta: response.data.meta || {
                        total: 0,
                        current_page: 1,
                        per_page: params.per_page || 10
                    }
                };
            } else {
                return {
                    success: false,
                    data: [],
                    meta: { total: 0, current_page: 1, per_page: 10 }
                };
            }
        } catch (error) {
            console.error('Error fetching bitacora:', error);
            return {
                success: false,
                data: [],
                meta: { total: 0, current_page: 1, per_page: 10 }
            };
        }
    },

    getAll: async (params = {}) => {
        const response = await api.get('/bitacora', {
            params: {
                ...params,
                per_page: params.per_page || 50
            }
        });
        return response.data?.data || [];
    },

    getById: async (id) => {
        const response = await api.get(`/bitacora/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/bitacora', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.patch(`/bitacora/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/bitacora/${id}`);
        return true;
    },
};

export default bitacoraService;