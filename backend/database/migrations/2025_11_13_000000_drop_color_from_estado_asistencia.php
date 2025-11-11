<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estado_asistencia', function (Blueprint $table) {
            if (Schema::hasColumn('estado_asistencia', 'color')) {
                $table->dropColumn('color');
            }
        });
    }

    public function down(): void
    {
        Schema::table('estado_asistencia', function (Blueprint $table) {
            if (!Schema::hasColumn('estado_asistencia', 'color')) {
                $table->string('color', 7)->default('#10B981')->after('descripcion');
            }
        });
    }
};
