import api from '../api.js';

const asistenciaService = {
    getAll: async (params = {}) => {
        const { data } = await api.get('/asistencias', { params });
        return data;
    },

    listarAsistencias: async ({ page = 1, per_page = 15, ...filters } = {}) => {
        try {
            const response = await api.get('/asistencias', {
                params: { page, per_page, ...filters }
            });

            if (response.data.success) {
                const payload = response.data.data;
                return {
                    rows: payload?.data || payload || [],
                    meta: {
                        current_page: payload?.current_page ?? 1,
                        last_page: payload?.last_page ?? 1,
                        total: payload?.total ?? 0,
                        per_page: payload?.per_page ?? 15
                    }
                };
            } else {
                return {
                    rows: [],
                    meta: {
                        current_page: 1,
                        last_page: 1,
                        total: 0,
                        per_page: 15
                    }
                };
            }
        } catch (error) {
            console.error('Error listando asistencias:', error);
            return {
                rows: [],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    total: 0,
                    per_page: 15
                }
            };
        }
    },

    getById: async (id) => {
        const { data } = await api.get(`/asistencias/${id}`);
        return data;
    },

    obtenerAsistencia: async (id) => {
        try {
            const response = await api.get(`/asistencias/${id}`);
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error obteniendo asistencia:', error);
            return null;
        }
    },

    create: async (payload) => {
        const { data } = await api.post('/asistencias', payload);
        return data;
    },

    update: async (id, payload) => {
        const { data } = await api.put(`/asistencias/${id}`, payload);
        return data;
    },

    remove: async (id) => {
        await api.delete(`/asistencias/${id}`);
    },

    verificarSesionQR: async () => {
        try {
            const response = await api.get('/asistencias/sesion-qr');
            return {
                success: response.data.success,
                activa: response.data.activa || false,
                mensaje: response.data.mensaje || ''
            };
        } catch (error) {
            console.error('Error verificando sesión QR:', error);
            return {
                success: false,
                activa: false,
                mensaje: 'No se pudo verificar la sesión QR'
            };
        }
    },

    verificarSesionConfirmacion: async () => {
        try {
            const response = await api.get('/asistencias/sesion-confirmacion');
            return {
                success: response.data.success,
                activa: response.data.activa || false,
                mensaje: response.data.mensaje || ''
            };
        } catch (error) {
            console.error('Error verificando sesión de confirmación:', error);
            return {
                success: false,
                activa: false,
                mensaje: 'No se pudo verificar la sesión de confirmación'
            };
        }
    },

    generarQR: async (horario_asignado_id) => {
        try {
            const response = await api.post('/asistencias/generar-qr', { horario_asignado_id });
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error generando QR:', error);
            return null;
        }
    },

    escanearQR: async (codigo_qr) => {
        try {
            const response = await api.post('/asistencias/escanear-qr', { codigo_qr });
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error escaneando QR:', error);
            return null;
        }
    },

    obtenerHorariosDisponibles: async (modalidad = 1, { virtualAutorizado } = {}) => {
        const params = { modalidad };
        if (virtualAutorizado !== undefined) {
            params.virtual_autorizado = virtualAutorizado;
        }

        const response = await api.get('/asistencias/horarios-disponibles', { params });
        if (!response.data.success) {
            throw new Error(response.data.message || 'No fue posible obtener los horarios disponibles');
        }

        return Array.isArray(response.data.data) ? response.data.data : [];
    },

    confirmarAsistenciaVirtual: async (horario_asignado_id) => {
        try {
            const response = await api.post('/asistencias/confirmar-virtual', { horario_asignado_id });
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error confirmando asistencia virtual:', error);
            return null;
        }
    }
};

export default asistenciaService;
