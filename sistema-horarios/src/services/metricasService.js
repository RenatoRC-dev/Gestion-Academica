import api from './api.js';

const readTotal = (payload) => {
  // Acepta varias formas de respuesta de paginación (Laravel):
  // 1) { success, meta: { total }, data: { data: [] } }
  // 2) { success, data: { total, data: [] } }
  // 3) { data: [] } sin meta -> usa length
  if (!payload) return 0;
  if (typeof payload?.meta?.total === 'number') return payload.meta.total;
  if (typeof payload?.data?.total === 'number') return payload.data.total;
  if (Array.isArray(payload?.data?.data)) return payload.data.data.length;
  if (Array.isArray(payload?.data)) return payload.data.length;
  return 0;
};

const metricasService = {
  obtenerMetricasGenerales: async () => {
    try {
      const [docentes, materias, aulas, grupos, periodos, usuarios] = await Promise.all([
        api.get('/docentes', { params: { per_page: 1 } }),
        api.get('/materias', { params: { per_page: 1 } }),
        api.get('/aulas', { params: { per_page: 1 } }),
        api.get('/grupos', { params: { per_page: 1 } }),
        api.get('/periodos', { params: { per_page: 1 } }),
        api.get('/usuarios', { params: { per_page: 1 } }),
      ]);

      return {
        total_docentes: readTotal(docentes.data),
        total_materias: readTotal(materias.data),
        total_aulas: readTotal(aulas.data),
        total_grupos: readTotal(grupos.data),
        total_periodos: readTotal(periodos.data),
        total_usuarios: readTotal(usuarios.data),
      };
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      return {
        total_docentes: 0,
        total_materias: 0,
        total_aulas: 0,
        total_grupos: 0,
        total_periodos: 0,
        total_usuarios: 0,
      };
    }
  }
};

export default metricasService;

