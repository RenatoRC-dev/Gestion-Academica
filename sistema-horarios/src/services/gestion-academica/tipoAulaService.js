import api from '../api.js';

const tipoAulaService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/tipos-aula', { params });
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/tipos-aula', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/tipos-aula/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    await api.delete(`/tipos-aula/${id}`);
  },
};

export default tipoAulaService;
