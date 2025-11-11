import api from './api.js';

const reporteService = {
    generar: async (filtros = {}) => {
        const { data } = await api.post('/reportes/asistencia/generar', filtros);
        return data;
    },

    exportarPDF: async (filtros = {}) => {
        const response = await api.post('/reportes/asistencia/exportar-pdf', filtros, {
            responseType: 'blob',
        });
        return response.data;
    },

    exportarExcel: async (filtros = {}) => {
        const response = await api.post('/reportes/asistencia/exportar-excel', filtros, {
            responseType: 'blob',
        });
        return response.data;
    },
};

export default reporteService;
