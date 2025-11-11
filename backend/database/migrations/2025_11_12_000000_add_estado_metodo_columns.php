<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estado_asistencia', function (Blueprint $table) {
            if (!Schema::hasColumn('estado_asistencia', 'color')) {
                $table->string('color', 7)->default('#10B981')->after('descripcion');
            }
            if (!Schema::hasColumn('estado_asistencia', 'cuenta_como_falta')) {
                $table->boolean('cuenta_como_falta')->default(false)->after('color');
            }
            if (!Schema::hasColumn('estado_asistencia', 'orden')) {
                $table->integer('orden')->default(0)->after('cuenta_como_falta');
            }
            if (!Schema::hasColumn('estado_asistencia', 'activo')) {
                $table->boolean('activo')->default(true)->after('orden');
            }
        });

        Schema::table('metodo_registro_asistencia', function (Blueprint $table) {
            if (!Schema::hasColumn('metodo_registro_asistencia', 'activo')) {
                $table->boolean('activo')->default(true)->after('descripcion');
            }
        });
    }

    public function down(): void
    {
        Schema::table('estado_asistencia', function (Blueprint $table) {
            if (Schema::hasColumn('estado_asistencia', 'activo')) {
                $table->dropColumn('activo');
            }
            if (Schema::hasColumn('estado_asistencia', 'orden')) {
                $table->dropColumn('orden');
            }
            if (Schema::hasColumn('estado_asistencia', 'cuenta_como_falta')) {
                $table->dropColumn('cuenta_como_falta');
            }
            if (Schema::hasColumn('estado_asistencia', 'color')) {
                $table->dropColumn('color');
            }
        });

        Schema::table('metodo_registro_asistencia', function (Blueprint $table) {
            if (Schema::hasColumn('metodo_registro_asistencia', 'activo')) {
                $table->dropColumn('activo');
            }
        });
    }
};
