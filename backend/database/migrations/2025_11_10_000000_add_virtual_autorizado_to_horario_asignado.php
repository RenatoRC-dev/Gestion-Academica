<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('horario_asignado', function (Blueprint $table) {
            $table->boolean('virtual_autorizado')->default(false)->after('modalidad_id');
        });
    }

    public function down(): void
    {
        Schema::table('horario_asignado', function (Blueprint $table) {
            $table->dropColumn('virtual_autorizado');
        });
    }
};
