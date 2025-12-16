import api from '../api.js';

const reporteEstadisticoService = {
  obtenerMensual: async () => {
    const response = await api.get('/reportes/estatico/mensual');
    return response.data;
  },

  exportarPDF: async () => {
    const response = await api.get('/reportes/estatico/mensual/pdf', { responseType: 'blob' });
    return response.data;
  },
};

export default reporteEstadisticoService;
