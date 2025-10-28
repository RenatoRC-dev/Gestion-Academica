<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rol
        Schema::create('rol', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique();
            $table->text('descripcion')->nullable();
            $table->timestampsTz();
        });

        // Usuario
        Schema::create('usuario', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_completo');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Usuario Rol
        Schema::create('usuario_rol', function (Blueprint $table) {
            $table->foreignId('usuario_id')->constrained('usuario')->onDelete('cascade');
            $table->foreignId('rol_id')->constrained('rol')->onDelete('cascade');
            $table->primary(['usuario_id', 'rol_id']);
        });

        // Persona
        Schema::create('persona', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->unique()->constrained('usuario')->onDelete('cascade');
            $table->string('nombre_completo');
            $table->string('ci', 50)->nullable();
            $table->string('telefono_contacto', 30)->nullable();
            $table->text('direccion')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Area Académica
        Schema::create('area_academica', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150)->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Docente
        Schema::create('docente', function (Blueprint $table) {
            $table->foreignId('persona_id')->primary()->constrained('persona')->onDelete('cascade');
            $table->string('codigo_docente', 50)->nullable()->unique();
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Docente Area
        Schema::create('docente_area', function (Blueprint $table) {
            $table->foreignId('docente_persona_id')->constrained('docente', 'persona_id')->onDelete('cascade');
            $table->foreignId('area_academica_id')->constrained('area_academica')->onDelete('restrict');
            $table->primary(['docente_persona_id', 'area_academica_id']);
        });

        // Area Administrativa
        Schema::create('area_administrativa', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150)->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Administrativo
        Schema::create('administrativo', function (Blueprint $table) {
            $table->foreignId('persona_id')->primary()->constrained('persona')->onDelete('cascade');
            $table->string('cargo', 100)->nullable();
            $table->foreignId('area_administrativa_id')->nullable()->constrained('area_administrativa')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Materia
        Schema::create('materia', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_materia', 50)->unique();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Tipo Aula
        Schema::create('tipo_aula', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique();
            $table->text('descripcion')->nullable();
            $table->timestampsTz();
        });

        // Aula
        Schema::create('aula', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_aula', 50)->unique();
            $table->integer('capacidad')->default(0);
            $table->foreignId('tipo_aula_id')->nullable()->constrained('tipo_aula')->onDelete('set null');
            $table->string('ubicacion', 100)->nullable();
            $table->text('equipamiento')->nullable();
            $table->boolean('es_virtual')->default(false);
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Periodo Académico
        Schema::create('periodo_academico', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique();
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->boolean('activo')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Grupo
        Schema::create('grupo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materia_id')->constrained('materia')->onDelete('restrict');
            $table->foreignId('periodo_academico_id')->constrained('periodo_academico')->onDelete('restrict');
            $table->string('codigo_grupo', 20);
            $table->integer('cupo_maximo')->nullable();
            $table->integer('cupo_minimo')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
            $table->unique(['materia_id', 'periodo_academico_id', 'codigo_grupo']);
        });

        // Dia
        Schema::create('dia', function (Blueprint $table) {
            $table->smallInteger('id')->primary();
            $table->string('nombre', 20)->unique();
        });

        // Horario
        Schema::create('horario', function (Blueprint $table) {
            $table->id();
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('descripcion', 50)->nullable()->unique();
            $table->timestampsTz();
            $table->unique(['hora_inicio', 'hora_fin']);
        });

        // Bloque Horario
        Schema::create('bloque_horario', function (Blueprint $table) {
            $table->id();
            $table->smallInteger('dia_id');
            $table->foreignId('horario_id')->constrained('horario')->onDelete('restrict');
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
            $table->unique(['dia_id', 'horario_id']);
            $table->foreign('dia_id')->references('id')->on('dia')->onDelete('restrict');
        });

        // Modalidad Clase
        Schema::create('modalidad_clase', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 30)->unique();
            $table->text('descripcion')->nullable();
            $table->timestampsTz();
        });

        // Horario Asignado
        Schema::create('horario_asignado', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grupo_id')->constrained('grupo')->onDelete('cascade');
            $table->foreignId('docente_id')->constrained('docente', 'persona_id')->onDelete('restrict');
            $table->foreignId('aula_id')->constrained('aula')->onDelete('restrict');
            $table->foreignId('bloque_horario_id')->constrained('bloque_horario')->onDelete('restrict');
            $table->foreignId('periodo_academico_id')->constrained('periodo_academico')->onDelete('restrict');
            $table->foreignId('modalidad_id')->constrained('modalidad_clase')->default(1);
            $table->date('fecha_especifica')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
            $table->unique(['docente_id', 'bloque_horario_id', 'periodo_academico_id', 'fecha_especifica']);
            $table->unique(['aula_id', 'bloque_horario_id', 'periodo_academico_id', 'fecha_especifica']);
            $table->unique(['grupo_id', 'bloque_horario_id', 'periodo_academico_id', 'fecha_especifica']);
        });

        // Código QR Asistencia
        Schema::create('codigo_qr_asistencia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('horario_asignado_id')->constrained('horario_asignado')->onDelete('cascade');
            $table->string('codigo_hash', 255)->unique();
            $table->timestampTz('fecha_hora_generacion')->useCurrent();
            $table->timestampTz('fecha_hora_expiracion');
            $table->boolean('utilizado')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
        });

        // Estado Asistencia
        Schema::create('estado_asistencia', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 30)->unique();
            $table->text('descripcion')->nullable();
            $table->timestampsTz();
        });

        // Método Registro Asistencia
        Schema::create('metodo_registro_asistencia', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 30)->unique();
            $table->text('descripcion')->nullable();
            $table->timestampsTz();
        });

        // Asistencia
        Schema::create('asistencia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('horario_asignado_id')->constrained('horario_asignado')->onDelete('restrict');
            $table->foreignId('docente_id')->constrained('docente', 'persona_id')->onDelete('restrict');
            $table->timestampTz('fecha_hora_registro')->useCurrent();
            $table->foreignId('estado_id')->constrained('estado_asistencia')->default(1);
            $table->foreignId('metodo_registro_id')->constrained('metodo_registro_asistencia');
            $table->foreignId('codigo_qr_id')->nullable()->constrained('codigo_qr_asistencia')->onDelete('set null');
            $table->text('observaciones')->nullable();
            $table->foreignId('registrado_por_id')->constrained('usuario')->onDelete('restrict');
            $table->foreignId('created_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('usuario')->onDelete('set null');
            $table->timestampsTz();
            $table->unique(['horario_asignado_id', 'docente_id']);
        });

        // Bitácora
        Schema::create('bitacora', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestampTz('fecha_hora')->useCurrent();
            $table->foreignId('usuario_id')->nullable()->constrained('usuario')->onDelete('set null');
            $table->string('accion', 100);
            $table->string('tabla_afectada', 100)->nullable();
            $table->integer('registro_id')->nullable();
            $table->json('datos_anteriores')->nullable();
            $table->json('datos_nuevos')->nullable();
            $table->string('direccion_ip', 45)->nullable();
            $table->text('descripcion')->nullable();
        });

        // Índices
        Schema::table('horario_asignado', function (Blueprint $table) {
            $table->index('periodo_academico_id');
        });

        Schema::table('asistencia', function (Blueprint $table) {
            $table->index(['docente_id', 'fecha_hora_registro']);
        });

        Schema::table('bitacora', function (Blueprint $table) {
            $table->index(['usuario_id', 'fecha_hora']);
        });

        // Insertar datos iniciales
        DB::table('dia')->insert([
            ['id' => 1, 'nombre' => 'Lunes'],
            ['id' => 2, 'nombre' => 'Martes'],
            ['id' => 3, 'nombre' => 'Miércoles'],
            ['id' => 4, 'nombre' => 'Jueves'],
            ['id' => 5, 'nombre' => 'Viernes'],
            ['id' => 6, 'nombre' => 'Sábado'],
            ['id' => 7, 'nombre' => 'Domingo'],
        ]);

        DB::table('modalidad_clase')->insert([
            ['nombre' => 'Presencial', 'descripcion' => 'Clase presencial'],
            ['nombre' => 'Virtual', 'descripcion' => 'Clase virtual'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora');
        Schema::dropIfExists('asistencia');
        Schema::dropIfExists('metodo_registro_asistencia');
        Schema::dropIfExists('estado_asistencia');
        Schema::dropIfExists('codigo_qr_asistencia');
        Schema::dropIfExists('horario_asignado');
        Schema::dropIfExists('modalidad_clase');
        Schema::dropIfExists('bloque_horario');
        Schema::dropIfExists('horario');
        Schema::dropIfExists('dia');
        Schema::dropIfExists('grupo');
        Schema::dropIfExists('periodo_academico');
        Schema::dropIfExists('aula');
        Schema::dropIfExists('tipo_aula');
        Schema::dropIfExists('materia');
        Schema::dropIfExists('administrativo');
        Schema::dropIfExists('area_administrativa');
        Schema::dropIfExists('docente_area');
        Schema::dropIfExists('docente');
        Schema::dropIfExists('area_academica');
        Schema::dropIfExists('persona');
        Schema::dropIfExists('usuario_rol');
        Schema::dropIfExists('usuario');
        Schema::dropIfExists('rol');
    }
};
