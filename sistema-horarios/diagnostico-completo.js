import path from 'path';

async function diagnosticoCompleto() {
    const diagnosticos = [
        './diagnostico-servicios.js',
        './diagnostico-interceptores.js',
        './diagnostico-rutas.js',
        './diagnostico-login.js',
        './diagnostico-avanzado.js'
    ];

    console.log('🔬 DIAGNÓSTICO MOLECULAR DEL FRONTEND 🔬');
    console.log('======================================');

    for (const diagnosticoPath of diagnosticos) {
        try {
            console.log(`\n📋 Ejecutando ${path.basename(diagnosticoPath)}:`);
            console.log('-'.repeat(50));

            const diagnostico = await import(diagnosticoPath);
            if (typeof diagnostico.default === 'function') {
                await diagnostico.default();
            }
        } catch (error) {
            console.error(`❌ Error en ${diagnosticoPath}:`, error);
        }
    }
}

diagnosticoCompleto().catch(console.error);