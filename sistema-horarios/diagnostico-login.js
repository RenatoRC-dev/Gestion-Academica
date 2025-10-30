import axios from 'axios';

async function diagnosticarLogin() {
    console.log('🔐 Diagnóstico de Autenticación');
    console.log('-------------------------------');

    const instanceLogin = axios.create({
        baseURL: 'http://localhost:8000/api',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    const credenciales = [
        { email: 'admin.qa@test.com', password: 'Admin123*' },
        { email: 'juan.perez@escuela.edu', password: 'Docente123*' }
    ];

    for (const cred of credenciales) {
        try {
            console.log(`\n🔍 Probando login con: ${cred.email}`);
            const respuesta = await instanceLogin.post('/login', cred);

            console.log('✅ Login exitoso');
            console.log('Token:', respuesta.data.token);
            console.log('Usuario:', respuesta.data.user);

            // Probar endpoint protegido con token
            const instanceProtegido = axios.create({
                baseURL: 'http://localhost:8000/api',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${respuesta.data.token}`
                }
            });

            try {
                const respuestaProtegida = await instanceProtegido.get('/usuarios');
                console.log('✅ Acceso a endpoint protegido exitoso');
                console.log('Datos recibidos:', respuestaProtegida.data);
            } catch (errorProtegido) {
                console.error('❌ Error en endpoint protegido:', errorProtegido.response?.data);
            }

        } catch (error) {
            console.error('❌ Error de login:', error.response?.data);
        }
    }
}

diagnosticarLogin().catch(console.error);