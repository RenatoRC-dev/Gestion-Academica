<?php

namespace Database\Seeders;

use App\Models\Usuario;
use App\Models\Persona;
use App\Models\Rol;
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

        // 3. Asignar rol admin
        $rolAdmin = Rol::where('nombre', 'admin')->first();
        if ($rolAdmin && !$usuario->roles->contains($rolAdmin)) {
            $usuario->roles()->attach($rolAdmin);
        }
    }
}