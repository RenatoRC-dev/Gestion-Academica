import axios from 'axios';

async function diagnosticoAvanzado() {
    console.log('🔬 DIAGNÓSTICO AVANZADO DE AUTENTICACIÓN Y SERVICIOS 🔬');
    console.log('==================================================');

    const instanceLogin = axios.create({
        baseURL: 'http://localhost:8000/api',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    const credenciales = [
        { email: 'admin.qa@test.com', password: 'Admin123*', rol: 'Admin' },
        { email: 'juan.perez@escuela.edu', password: 'Docente123*', rol: 'Docente' }
    ];

    for (const cred of credenciales) {
        try {
            console.log(`\n🔐 Probando login ${cred.rol}: ${cred.email}`);
            const respuestaLogin = await instanceLogin.post('/login', cred);

            console.log('✅ Login exitoso');
            console.log('Token:', respuestaLogin.data.token);
            console.log('Usuario:', respuestaLogin.data.user);

            // Crear instancia con token
            const instanceProtegido = axios.create({
                baseURL: 'http://localhost:8000/api',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${respuestaLogin.data.token}`
                }
            });

            // Endpoints a probar
            const endpoints = [
                { url: '/usuarios', nombre: 'Usuarios' },
                { url: '/docentes', nombre: 'Docentes' },
                { url: '/materias', nombre: 'Materias' },
                { url: '/aulas', nombre: 'Aulas' },
                { url: '/grupos', nombre: 'Grupos' }
            ];

            console.log(`\n🌐 Probando endpoints para ${cred.rol}`);
            for (const endpoint of endpoints) {
                try {
                    const respuesta = await instanceProtegido.get(endpoint.url, {
                        params: { per_page: 1 }
                    });

                    console.log(`✅ Endpoint ${endpoint.nombre} accesible`);
                    console.log('Total registros:', respuesta.data.meta?.total || 'N/A');
                } catch (errorEndpoint) {
                    console.error(`❌ Error en ${endpoint.nombre}:`,
                        errorEndpoint.response?.data || errorEndpoint.message);
                }
            }

        } catch (errorLogin) {
            console.error('❌ Error de login:', errorLogin.response?.data);
        }
    }

    // Prueba de token expirado
    console.log('\n⏰ Prueba de token expirado');
    try {
        const instanceExpirado = axios.create({
            baseURL: 'http://localhost:8000/api',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer token_expirado_invalido'
            }
        });

        await instanceExpirado.get('/usuarios');
    } catch (errorExpirado) {
        console.log('✅ Manejo correcto de token expirado');
        console.log('Código de error:', errorExpirado.response?.status);
        console.log('Mensaje:', errorExpirado.response?.data);
    }
}

diagnosticoAvanzado().catch(console.error);