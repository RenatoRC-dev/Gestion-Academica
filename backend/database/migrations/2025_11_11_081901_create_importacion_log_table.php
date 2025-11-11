<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('importacion_log', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_importacion', 50); // 'docentes', 'estudiantes', 'usuarios'
            $table->string('archivo_original', 255);
            $table->integer('total_registros')->default(0);
            $table->integer('exitosos')->default(0);
            $table->integer('fallidos')->default(0);
            $table->text('errores_detalle')->nullable(); // JSON con errores por fila
            $table->foreignId('importado_por_id')->constrained('usuario', 'id')->onDelete('cascade');
            $table->timestamp('fecha_importacion')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('importacion_log');
    }
};
