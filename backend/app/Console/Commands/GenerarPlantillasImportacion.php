<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DocentePlantillaExport;
use App\Exports\EstudiantePlantillaExport;
use App\Exports\UsuarioPlantillaExport;

class GenerarPlantillasImportacion extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'importacion:generar-plantillas';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Genera las plantillas Excel para importación masiva';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generando plantillas de importación...');

        $directorio = storage_path('app/plantillas');
        if (!file_exists($directorio)) {
            mkdir($directorio, 0755, true);
            $this->info("Directorio 'plantillas' creado.");
        }

        // Generar plantilla de docentes
        Excel::store(new DocentePlantillaExport(), 'plantillas/plantilla_docentes.xlsx', 'local');
        $this->info('✓ Plantilla de docentes generada');

        // Generar plantilla de estudiantes
        Excel::store(new EstudiantePlantillaExport(), 'plantillas/plantilla_estudiantes.xlsx', 'local');
        $this->info('✓ Plantilla de estudiantes generada');

        // Generar plantilla de usuarios
        Excel::store(new UsuarioPlantillaExport(), 'plantillas/plantilla_usuarios.xlsx', 'local');
        $this->info('✓ Plantilla de usuarios generada');

        $this->newLine();
        $this->info('¡Todas las plantillas han sido generadas exitosamente!');
        $this->info("Ubicación: {$directorio}");

        return 0;
    }
}
