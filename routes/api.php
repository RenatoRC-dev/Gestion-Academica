<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocenteController;
use App\Http\Controllers\Api\MateriaController;
use App\Http\Controllers\Api\AulaController;
use App\Http\Controllers\Api\GrupoController;
use App\Http\Controllers\Api\PeriodoController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\AsistenciaController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas (requieren token)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // CRUD Entidades Maestras
    Route::apiResource('docentes', DocenteController::class);
    Route::apiResource('materias', MateriaController::class);
    Route::apiResource('aulas', AulaController::class);
    Route::apiResource('grupos', GrupoController::class);
    Route::apiResource('periodos', PeriodoController::class);

    // Horarios
    Route::apiResource('horarios', HorarioController::class);
    Route::post('/horarios/generar', [HorarioController::class, 'generar']);
    Route::get('/horarios/docente/actual', [HorarioController::class, 'horarioDocente']);
    Route::patch('/horarios/{horario}/estado', [HorarioController::class, 'actualizarEstado']);

    // Asistencia
    Route::apiResource('asistencias', AsistenciaController::class);
    Route::post('/asistencias/generar-qr', [AsistenciaController::class, 'generarQR']);
    Route::post('/asistencias/registrar-qr', [AsistenciaController::class, 'registrarQR']);
    Route::post('/asistencias/confirmar-virtual', [AsistenciaController::class, 'confirmarVirtual']);
    Route::post('/asistencias/registrar-manual', [AsistenciaController::class, 'registrarManual']);
    Route::get('/asistencias/docente/{docente_id}', [AsistenciaController::class, 'asistenciaDocente']);
});

Route::fallback(function () {
    return response()->json(['error' => 'Endpoint no encontrado'], 404);
});