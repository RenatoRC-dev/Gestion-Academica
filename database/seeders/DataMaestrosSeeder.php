<?php

namespace Database\Seeders;

use App\Models\TipoAula;
use App\Models\EstadoAsistencia;
use App\Models\ModalidadClase;
use App\Models\MetodoRegistroAsistencia;
use App\Models\BloqueHorario;
use Illuminate\Database\Seeder;

class DataMaestrosSeeder extends Seeder
{
    public function run(): void
    {
        // Tipos de Aula
        $tipos = [
            ['nombre' => 'Aula Teoría', 'descripcion' => 'Aula de clases teóricas'],
            ['nombre' => 'Laboratorio', 'descripcion' => 'Laboratorio de computación'],
            ['nombre' => 'Taller', 'descripcion' => 'Taller de prácticas'],
            ['nombre' => 'Auditorio', 'descripcion' => 'Auditorio'],
        ];
        foreach ($tipos as $tipo) {
            TipoAula::firstOrCreate(['nombre' => $tipo['nombre']], $tipo);
        }

        // Estados de Asistencia
        $estados = [
            ['nombre' => 'Presente', 'descripcion' => 'Presente en clase'],
            ['nombre' => 'Ausente', 'descripcion' => 'Ausente sin justificar'],
            ['nombre' => 'Justificado', 'descripcion' => 'Ausencia justificada'],
            ['nombre' => 'Retraso', 'descripcion' => 'Llegó tarde'],
            ['nombre' => 'Virtual Autenticado', 'descripcion' => 'Participó en clase virtual'],
        ];
        foreach ($estados as $estado) {
            EstadoAsistencia::firstOrCreate(['nombre' => $estado['nombre']], $estado);
        }

        // Modalidades de Clase
        $modalidades = [
            ['nombre' => 'Presencial', 'descripcion' => 'Clase presencial'],
            ['nombre' => 'Virtual', 'descripcion' => 'Clase virtual'],
            ['nombre' => 'Hibrida', 'descripcion' => 'Clase híbrida'],
        ];
        foreach ($modalidades as $modalidad) {
            ModalidadClase::firstOrCreate(['nombre' => $modalidad['nombre']], $modalidad);
        }

        // Métodos de Registro de Asistencia
        $metodos = [
            ['nombre' => 'QR', 'descripcion' => 'Código QR'],
            ['nombre' => 'Manual', 'descripcion' => 'Registro manual'],
            ['nombre' => 'Biométrico', 'descripcion' => 'Biométrico'],
            ['nombre' => 'Confirmación Virtual', 'descripcion' => 'Confirmación virtual'],
        ];
        foreach ($metodos as $metodo) {
            MetodoRegistroAsistencia::firstOrCreate(['nombre' => $metodo['nombre']], $metodo);
        }

        // Nota: BloqueHorario requiere dia_id y horario_id
        // Se crean manualmente si es necesario a través de la API
    }
}