// src/services/gestion-academica/materiaService.js
import api from '../api.js';

const materiaService = {
    getMaterias: async (params = {}) => {
        try {
            const response = await api.get('/materias', {
                params: {
                    ...params,
                    per_page: params.per_page || 15
                }
            });
            const payload = response.data;
            // Normalizar para slices que esperan meta en top-level
            const p = payload?.data || {};
            const meta = {
                total: p?.total ?? payload?.meta?.total ?? 0,
                current_page: p?.current_page ?? payload?.meta?.current_page ?? 1,
                last_page: p?.last_page ?? payload?.meta?.last_page ?? 1,
                per_page: p?.per_page ?? payload?.meta?.per_page ?? (Array.isArray(p?.data) ? p.data.length : (params.per_page || 15))
            };
            return { success: payload?.success !== false, data: { data: p?.data || [] }, meta };
        } catch (error) {
            console.error('Error fetching materias:', error);
            return {
                success: false,
                data: { data: [] },
                meta: { total: 0, current_page: 1, per_page: params.per_page || 15, last_page: 1 }
            };
        }
    },

    getAll: async (params = {}) => {
        try {
            const response = await api.get('/materias', {
                params: {
                    ...params,
                    per_page: params.per_page || 50
                }
            });

            console.log('Respuesta de getAll materias:', response.data);

            return {
                data: response.data?.data || [],
                meta: {
                    total: response.data?.meta?.total ||
                           response.data?.total ||
                           (Array.isArray(response.data?.data) ? response.data.data.length : 0)
                }
            };
        } catch (error) {
            console.error('Error en getAll materias:', error);
            return {
                data: [],
                meta: { total: 0 }
            };
        }
    },

    getById: async (id) => {
        const { data } = await api.get(`/materias/${id}`);
        return data;
    },

    create: async (payload) => {
        const { data } = await api.post('/materias', payload);
        return data;
    },

    update: async (id, payload) => {
        const { data } = await api.put(`/materias/${id}`, payload);
        return data;
    },

    remove: async (id) => {
        await api.delete(`/materias/${id}`);
        return true;
    },
};

export default materiaService;
