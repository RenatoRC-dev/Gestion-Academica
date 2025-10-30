import axios from 'axios';

// Simular localStorage para entorno Node.js
const localStorage = {
    getItem: () => 'token_simulado',
    setItem: () => {},
    removeItem: () => {}
};
global.localStorage = localStorage;

function diagnosticarInterceptores() {
    console.log('🔍 Diagnóstico de Interceptores de Axios:');
    console.log('------------------------------------');

    // Creación de instancia de Axios para pruebas
    const instanceDiagnostico = axios.create({
        baseURL: 'http://localhost:8000/api',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    // Clonar configuración de interceptores originales
    instanceDiagnostico.interceptors.request.use(
        (config) => {
            console.log('🔐 Request Interceptor:');
            const token = localStorage.getItem('token');
            if (token) {
                console.log('✅ Token encontrado en localStorage');
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.warn('⚠️ No se encontró token en localStorage');
            }
            console.log('Request Headers:', config.headers);
            return config;
        },
        (error) => Promise.reject(error)
    );

    instanceDiagnostico.interceptors.response.use(
        (response) => {
            console.log('📡 Response Interceptor:');
            console.log('✅ Respuesta recibida exitosamente');
            return response;
        },
        (error) => {
            console.error('❌ Error en Response Interceptor:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);

            if (error.response?.status === 401 || error.response?.status === 419) {
                console.warn('🚫 Token inválido o expirado');
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (global.location?.pathname !== '/login') {
                    console.log('🔁 Redirigiendo a login');
                }
            }

            return Promise.reject(error);
        }
    );

    // Función para probar conexiones
    async function probarConexiones() {
        const endpoints = [
            '/usuarios',
            '/docentes',
            '/materias',
            '/aulas',
            '/grupos'
        ];

        console.log('\n🌐 Probando Endpoints:');
        for (const endpoint of endpoints) {
            try {
                console.log(`\n🔍 Probando ${endpoint}:`);
                const respuesta = await instanceDiagnostico.get(endpoint, {
                    params: { per_page: 1 }
                });
                console.log(`✅ Endpoint ${endpoint} funciona correctamente`);
                console.log('Estado:', respuesta.status);
                console.log('Datos recibidos:', JSON.stringify(respuesta.data).slice(0, 200) + '...');
            } catch (error) {
                console.error(`❌ Error en endpoint ${endpoint}:`, error.message);
                console.error('Detalles del error:', error.response?.data || error);
            }
        }
    }

    probarConexiones().catch(console.error);
}

diagnosticarInterceptores();