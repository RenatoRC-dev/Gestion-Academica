// src/services/gestion-academica/aulaService.js
import api from '../api.js';

const aulaService = {
    getAulas: async (params = {}) => {
        try {
            const response = await api.get('/aulas', {
                params: {
                    ...params,
                    per_page: params.per_page || 15
                }
            });
            const payload = response.data;
            const p = payload?.data || {};
            const meta = {
                total: p?.total ?? payload?.meta?.total ?? 0,
                current_page: p?.current_page ?? payload?.meta?.current_page ?? 1,
                last_page: p?.last_page ?? payload?.meta?.last_page ?? 1,
                per_page: p?.per_page ?? payload?.meta?.per_page ?? (Array.isArray(p?.data) ? p.data.length : (params.per_page || 15))
            };
            return { success: payload?.success !== false, data: { data: p?.data || [] }, meta };
        } catch (error) {
            console.error('Error fetching aulas:', error);
            return {
                success: false,
                data: { data: [] },
                meta: { total: 0, current_page: 1, per_page: params.per_page || 15, last_page: 1 }
            };
        }
    },

    getAll: async (params = {}) => {
        const response = await api.get('/aulas', {
            params: {
                ...params,
                per_page: params.per_page || 50
            }
        });
        return response.data?.data || [];
    },

    getById: async (id) => {
        const { data } = await api.get(`/aulas/${id}`);
        return data;
    },

    create: async (payload) => {
        const { data } = await api.post('/aulas', payload);
        return data;
    },

    update: async (id, payload) => {
        const { data } = await api.put(`/aulas/${id}`, payload);
        return data;
    },

    remove: async (id) => {
        await api.delete(`/aulas/${id}`);
        return true;
    },
};

export default aulaService;
