<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rol;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar roles existentes
        Rol::query()->delete();

        // Crear roles del sistema
        $roles = [
            [
                'nombre' => 'administrador_academico',
                'descripcion' => 'Administrador Académico - Acceso completo al sistema',
            ],
            [
                'nombre' => 'docente',
                'descripcion' => 'Docente - Puede consultar horarios y registrar asistencia',
            ],
            [
                'nombre' => 'autoridad_academica',
                'descripcion' => 'Autoridad Académica - Puede consultar reportes',
            ],
        ];

        foreach ($roles as $rol) {
            Rol::create($rol);
        }
    }
}