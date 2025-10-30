import fs from 'fs';
import path from 'path';

function verificarImports(directorio) {
    const archivosProblematicos = [];

    function explorarArchivo(rutaArchivo) {
        const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
        const importRegex = /from\s+['"]([^'"]+)['"];/g;
        let match;

        while ((match = importRegex.exec(contenido)) !== null) {
            const importPath = match[1];

            // Verificar imports locales
            if (importPath.startsWith('./') || importPath.startsWith('../')) {
                const rutaImportCompleta = path.resolve(path.dirname(rutaArchivo), importPath);

                // Probar variantes de extensión
                const variantes = [
                    rutaImportCompleta,
                    rutaImportCompleta + '.js',
                    rutaImportCompleta + '.jsx',
                    rutaImportCompleta + '.ts',
                    rutaImportCompleta + '.tsx'
                ];

                const existente = variantes.find(fs.existsSync);

                if (!existente) {
                    archivosProblematicos.push({
                        archivo: rutaArchivo,
                        import: importPath,
                        variantes: variantes
                    });
                }
            }
        }
    }

    function explorarDirectorio(dir) {
        const contenido = fs.readdirSync(dir);

        contenido.forEach(elemento => {
            const rutaCompleta = path.join(dir, elemento);
            const stats = fs.statSync(rutaCompleta);

            if (stats.isDirectory()) {
                // Ignorar directorios específicos
                const directoriosIgnorar = ['node_modules', 'dist', 'build'];
                if (!directoriosIgnorar.includes(elemento)) {
                    explorarDirectorio(rutaCompleta);
                }
            } else if (stats.isFile() && (elemento.endsWith('.js') || elemento.endsWith('.jsx'))) {
                explorarArchivo(rutaCompleta);
            }
        });
    }

    explorarDirectorio(directorio);

    if (archivosProblematicos.length > 0) {
        console.log('🚨 Imports problemáticos encontrados:');
        archivosProblematicos.forEach(problema => {
            console.log('\n📄 Archivo:', problema.archivo);
            console.log('🔗 Import problemático:', problema.import);
            console.log('❌ Variantes no encontradas:');
            problema.variantes.forEach(variante => console.log(`   - ${variante}`));
        });
    } else {
        console.log('✅ No se encontraron problemas de imports');
    }
}

const directorioProyecto = 'D:\\Avance\\SI1\\gestion_academica\\sistema-horarios\\src';
verificarImports(directorioProyecto);