<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tipo_aula', function (Blueprint $table) {
            if (!Schema::hasColumn('tipo_aula', 'activo')) {
                $table->boolean('activo')->default(true)->after('descripcion');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tipo_aula', function (Blueprint $table) {
            if (Schema::hasColumn('tipo_aula', 'activo')) {
                $table->dropColumn('activo');
            }
        });
    }
};
