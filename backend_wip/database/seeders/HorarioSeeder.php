<?php

namespace Database\Seeders;

use App\Models\Horario;
use Illuminate\Database\Seeder;

class HorarioSeeder extends Seeder
{
    public function run(): void
    {
        $horarios = [
            ['hora_inicio' => '07:00', 'hora_fin' => '08:00', 'descripcion' => 'Bloque 1'],
            ['hora_inicio' => '08:00', 'hora_fin' => '09:00', 'descripcion' => 'Bloque 2'],
            ['hora_inicio' => '09:00', 'hora_fin' => '10:00', 'descripcion' => 'Bloque 3'],
            ['hora_inicio' => '10:00', 'hora_fin' => '11:00', 'descripcion' => 'Bloque 4'],
            ['hora_inicio' => '11:00', 'hora_fin' => '11:15', 'descripcion' => 'Descanso'],
            ['hora_inicio' => '11:15', 'hora_fin' => '12:15', 'descripcion' => 'Bloque 5'],
            ['hora_inicio' => '12:15', 'hora_fin' => '13:15', 'descripcion' => 'Bloque 6'],
            ['hora_inicio' => '14:00', 'hora_fin' => '15:00', 'descripcion' => 'Bloque 7'],
            ['hora_inicio' => '15:00', 'hora_fin' => '16:00', 'descripcion' => 'Bloque 8'],
            ['hora_inicio' => '16:00', 'hora_fin' => '17:00', 'descripcion' => 'Bloque 9'],
        ];

        foreach ($horarios as $horario) {
            Horario::firstOrCreate(['hora_inicio' => $horario['hora_inicio'], 'hora_fin' => $horario['hora_fin']], $horario);
        }
    }
}