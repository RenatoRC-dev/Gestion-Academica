import api from './api.js';

const importacionService = {
    /**
     * Validar archivo antes de importar (vista previa)
     */
    validar: async (archivo, tipoImportacion) => {
        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('tipo_importacion', tipoImportacion);

        const { data } = await api.post('/importaciones/validar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    /**
     * Procesar importación masiva
     */
    importar: async (archivo, tipoImportacion) => {
        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('tipo_importacion', tipoImportacion);

        const { data } = await api.post('/importaciones/importar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    /**
     * Obtener historial de importaciones
     */
    historial: async (filtros = {}) => {
        const { data } = await api.get('/importaciones/historial', { params: filtros });
        return data;
    },

    /**
     * Descargar plantilla Excel de ejemplo
     */
    descargarPlantilla: async (tipo) => {
        const response = await api.get('/importaciones/descargar-plantilla', {
            params: { tipo },
            responseType: 'blob',
        });

        // Crear blob y descargar
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `plantilla_${tipo}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

export default importacionService;
