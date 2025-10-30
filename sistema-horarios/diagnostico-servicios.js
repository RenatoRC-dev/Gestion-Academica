import api from './src/services/api.js';
import docenteService from './src/services/docenteService.js';
import materiaService from './src/services/materiaService.js';
import aulaService from './src/services/aulaService.js';
import grupoService from './src/services/grupoService.js';
import usuarioService from './src/services/usuarioService.js';

// Simular localStorage para entorno Node.js
const localStorage = {
    getItem: () => 'token_simulado',
    setItem: () => {},
    removeItem: () => {}
};
global.localStorage = localStorage;

async function diagnosticarServicios() {
    console.log('🔍 Diagnóstico de Servicios:');
    console.log('-------------------------');

    // Verificar configuración base de API
    console.log('📡 Configuración Base de API:');
    console.log(`Base URL: ${api.defaults.baseURL}`);
    console.log(`Timeout: ${api.defaults.timeout}ms`);

    console.log('\n🧪 Prueba de Servicios:');

    const servicios = [
        { nombre: 'Docentes', servicio: docenteService },
        { nombre: 'Materias', servicio: materiaService },
        { nombre: 'Aulas', servicio: aulaService },
        { nombre: 'Grupos', servicio: grupoService },
        { nombre: 'Usuarios', servicio: usuarioService }
    ];

    for (const { nombre, servicio } of servicios) {
        try {
            console.log(`\n🔎 Probando ${nombre}:`);
            const respuesta = await (servicio.getAll || servicio.getUsuarios)({ per_page: 1 });
            console.log(`✅ Servicio ${nombre} funciona correctamente`);
            console.log('Ejemplo de respuesta:', JSON.stringify(respuesta, null, 2).slice(0, 200) + '...');
        } catch (error) {
            console.error(`❌ Error en servicio ${nombre}:`, error.message);
            console.error('Detalles del error:', error.response?.data || error);
        }
    }
}

diagnosticarServicios().catch(console.error);