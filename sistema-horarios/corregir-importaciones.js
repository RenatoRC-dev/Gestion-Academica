import fs from 'fs';
import path from 'path';

function corregirImportaciones(directorio) {
    const archivosJS = obtenerArchivosJS(directorio);

    archivosJS.forEach(archivo => {
        let contenido = fs.readFileSync(archivo, 'utf-8');

        // Corregir importaciones sin extensión
        const importRegex = /from\s+['"]([^'"]+)['"];/g;
        const nuevosImports = contenido.replace(importRegex, (match, importPath) => {
            // Ignorar importaciones de paquetes npm
            if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
                return match;
            }

            // Añadir .js si no tiene extensión
            if (!importPath.endsWith('.js')) {
                const nuevoImportPath = importPath.endsWith('.js') ? importPath : `${importPath}.js`;
                console.log(`🔄 Corrigiendo import en ${archivo}: ${importPath} → ${nuevoImportPath}`);
                return `from '${nuevoImportPath}';`;
            }

            return match;
        });

        if (nuevosImports !== contenido) {
            fs.writeFileSync(archivo, nuevosImports);
            console.log(`✅ Archivo modificado: ${archivo}`);
        }
    });
}

function obtenerArchivosJS(directorio) {
    const archivos = [];

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
                archivos.push(rutaCompleta);
            }
        });
    }

    explorarDirectorio(directorio);
    return archivos;
}

const directorioProyecto = 'D:\\Avance\\SI1\\gestion_academica\\sistema-horarios\\src';
corregirImportaciones(directorioProyecto);

console.log('✨ Corrección de importaciones completada');