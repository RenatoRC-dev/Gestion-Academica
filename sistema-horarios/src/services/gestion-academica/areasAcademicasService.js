import api from '../api.js';

const areasAcademicasService = {
  listar: async ({ page = 1, per_page = 15, search = '', activo } = {}) => {
    const params = { page, per_page };
    if (search) params.search = search;
    if (typeof activo !== 'undefined') params.activo = activo;

    const resp = await api.get('/areas-academicas', { params });
    const payload = resp?.data?.data ?? {};

    return {
      rows: Array.isArray(payload.data) ? payload.data : [],
      meta: {
        current_page: payload.current_page ?? 1,
        last_page: payload.last_page ?? 1,
        total: payload.total ?? 0,
        per_page: payload.per_page ?? per_page,
      },
    };
  },

  crear: async (payload) => {
    const resp = await api.post('/areas-academicas', payload);
    return resp?.data ?? resp;
  },

  actualizar: async (id, payload) => {
    const resp = await api.put(`/areas-academicas/${id}`, payload);
    return resp?.data ?? resp;
  },

  eliminar: async (id) => {
    const resp = await api.delete(`/areas-academicas/${id}`);
    return resp?.data ?? resp;
  },
};

export default areasAcademicasService;
