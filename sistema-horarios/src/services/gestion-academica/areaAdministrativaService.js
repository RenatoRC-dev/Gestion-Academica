import api from '../api.js';

const areaAdministrativaService = {
    /**
     * Listar todas las áreas administrativas
     */
    getAll: async (params = {}) => {
        const { data } = await api.get('/areas-administrativas', { params });
        return data;
    },

    /**
     * Obtener una área administrativa por ID
     */
    getById: async (id) => {
        const { data } = await api.get(`/areas-administrativas/${id}`);
        return data;
    },

    /**
     * Crear una nueva área administrativa
     */
    create: async (payload) => {
        const { data } = await api.post('/areas-administrativas', payload);
        return data;
    },

    /**
     * Actualizar un área administrativa
     */
    update: async (id, payload) => {
        const { data } = await api.put(`/areas-administrativas/${id}`, payload);
        return data;
    },

    /**
     * Eliminar un área administrativa
     */
    delete: async (id) => {
        await api.delete(`/areas-administrativas/${id}`);
    },
};

export default areaAdministrativaService;
