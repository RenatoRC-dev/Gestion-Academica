<?php

namespace Database\Seeders;

use App\Models\BloqueHorario;
use Illuminate\Database\Seeder;

class BloqueHorarioSeeder extends Seeder
{
    public function run(): void
    {
        // Crear bloques para cada día y cada horario
        $dias = [1, 2, 3, 4, 5];
        $horarios = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        foreach ($dias as $dia_id) {
            foreach ($horarios as $horario_id) {
                BloqueHorario::firstOrCreate(
                    ['dia_id' => $dia_id, 'horario_id' => $horario_id],
                    ['activo' => true]
                );
            }
        }
    }
}