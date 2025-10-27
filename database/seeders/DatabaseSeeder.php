<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DataMaestrosSeeder::class,
            DiaSeeder::class,
            HorarioSeeder::class,
            BloqueHorarioSeeder::class,
            AdminSeeder::class,
        ]);
    }
}