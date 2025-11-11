// src/services/docenteService.js
import api from './api.js';

const docenteService = {
    getDocentes: async (params = {}) => {
        try {
            const response = await api.get('/docentes', {
                params: {
                    ...params,
                    per_page: params.per_page || 15
                }
            });
            if (response.data.success) {
                return response.data;
            }
            throw new Error(response.data.message || 'Error al obtener docentes');
        } catch (error) {
            console.error('Error fetching docentes:', error);
            return {
                success: false,
                data: [],
                meta: { total: 0, current_page: 1, per_page: params.per_page || 15 },
                message: error.message
            };
        }
    },

    getAll: async (params = {}) => {
        try {
            const response = await api.get('/docentes', {
                params: {
                    ...params,
                    per_page: params.per_page || 50
                }
            });

            console.log('Respuesta de getAll docentes:', response.data);

            // Intentar devolver un objeto con datos y metadata
            return {
                data: response.data?.data || [],
                meta: {
                    total: response.data?.meta?.total ||
                           response.data?.total ||
                           (Array.isArray(response.data?.data) ? response.data.data.length : 0)
                }
            };
        } catch (error) {
            console.error('Error en getAll docentes:', error);
            return {
                data: [],
                meta: { total: 0 }
            };
        }
    },

    getById: async (id) => {
        const response = await api.get(`/docentes/${id}`);
        return response.data;
    },

    getCurrent: async () => {
        const response = await api.get('/docentes/yo');
        return response.data;
    },

    create: async (payload) => {
        const response = await api.post('/docentes', payload);
        return response.data;
    },

    update: async (id, payload) => {
        const response = await api.put(`/docentes/${id}`, payload);
        return response.data;
    },

    remove: async (id) => {
        await api.delete(`/docentes/${id}`);
        return true;
    }
};

export default docenteService;
