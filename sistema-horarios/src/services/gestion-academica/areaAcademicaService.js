import api from '../api.js';

const areaAcademicaService = {
    /**
     * Listar todas las áreas académicas
     */
    getAll: async (params = {}) => {
        const { data } = await api.get('/areas-academicas', { params });
        return data;
    },

    /**
     * Obtener una área académica por ID
     */
    getById: async (id) => {
        const { data } = await api.get(`/areas-academicas/${id}`);
        return data;
    },

    /**
     * Crear una nueva área académica
     */
    create: async (payload) => {
        const { data } = await api.post('/areas-academicas', payload);
        return data;
    },

    /**
     * Actualizar un área académica
     */
    update: async (id, payload) => {
        const { data } = await api.put(`/areas-academicas/${id}`, payload);
        return data;
    },

    /**
     * Eliminar un área académica
     */
    delete: async (id) => {
        await api.delete(`/areas-academicas/${id}`);
    },
};

export default areaAcademicaService;
