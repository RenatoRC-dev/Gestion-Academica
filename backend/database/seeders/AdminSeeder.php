<?php

namespace Database\Seeders;

use App\Models\Usuario;
use App\Models\Persona;
use App\Models\Rol;
use App\Models\Docente;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear Usuario
        $usuario = Usuario::firstOrCreate(
            ['email' => 'admin@gestion-academica.edu'],
            [
                'nombre_completo' => 'Administrador del Sistema',
                'password_hash' => bcrypt('Admin.1234'),
                'activo' => true,
            ]
        );

        // 2. Crear Persona asociada
        $persona = Persona::firstOrCreate(
            ['usuario_id' => $usuario->id],
            [
                'nombre_completo' => 'Administrador del Sistema',
                'ci' => 'ADMIN001',
                'telefono_contacto' => null,
                'direccion' => null,
            ]
        );

        $rolAdmin = Rol::where('nombre', 'administrador_academico')->first();
        $rolDocente = Rol::where('nombre', 'docente')->first();
        if ($rolAdmin && !$usuario->roles->contains($rolAdmin)) {
            $usuario->roles()->attach($rolAdmin);
        }
        if ($rolDocente && !$usuario->roles->contains($rolDocente)) {
            $usuario->roles()->attach($rolDocente);
        }

        if ($rolDocente) {
            Docente::firstOrCreate(
                ['persona_id' => $persona->id],
                [
                    'codigo_docente' => 'DOC-0000',
                    'created_by' => $usuario->id,
                    'updated_by' => $usuario->id,
                ]
            );
        }
    }
}
