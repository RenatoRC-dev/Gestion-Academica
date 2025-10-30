function diagnosticoRutas() {
    console.log('🔍 Diagnóstico de Rutas del Frontend:');
    console.log('-------------------------------------');

    // Rutas definidas
    const rutasDiagnostico = [
        { path: "/", nombre: "Raíz" },
        { path: "/login", nombre: "Login" },
        { path: "/dashboard", nombre: "Dashboard" },
        { path: "/usuarios", nombre: "Usuarios" },
        { path: "/docentes", nombre: "Docentes" },
        { path: "/materias", nombre: "Materias" },
        { path: "/aulas", nombre: "Aulas" },
        { path: "/grupos", nombre: "Grupos" }
    ];

    console.log('🧭 Rutas Configuradas:');
    rutasDiagnostico.forEach(ruta => {
        console.log(`📍 Ruta: ${ruta.path} (${ruta.nombre})`);
    });

    console.log('\n🔒 Análisis de Rutas Protegidas:');
    console.log('NOTA: Requiere verificación manual de componentes ProtectedRoute');
}

diagnosticoRutas();