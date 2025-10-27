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
use App\Http\Controllers\Api\BloqueHorarioController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\UsuarioRolController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\BitacoraController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas (requieren token)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // CRUD Entidades Maestras
    Route::apiResource('docentes', DocenteController::class);
    Route::get('/docentes/{docente}/areas', [DocenteController::class, 'areas']);
    Route::post('/docentes/{docente}/areas/asignar', [DocenteController::class, 'asignarArea']);
    Route::post('/docentes/{docente}/areas/revocar', [DocenteController::class, 'revocarArea']);
    Route::apiResource('materias', MateriaController::class);
    Route::apiResource('aulas', AulaController::class);
    Route::apiResource('grupos', GrupoController::class);
    Route::apiResource('periodos', PeriodoController::class);
    Route::apiResource('bloques-horarios', BloqueHorarioController::class);
    Route::get('/bloques-horarios/por-dia', [BloqueHorarioController::class, 'bloquesPorDia']);

    // Gestionar Usuarios
    Route::apiResource('usuarios', UsuarioController::class);
    // Roles y Usuarios
    Route::apiResource('roles', RolController::class);
    Route::get('/usuarios/{usuario}/roles', [UsuarioRolController::class, 'rolesDelUsuario']);
    Route::post('/usuarios/{usuario}/roles/asignar', [UsuarioRolController::class, 'asignarRol']);
    Route::post('/usuarios/{usuario}/roles/revocar', [UsuarioRolController::class, 'revocarRol']);
    Route::post('/usuarios/{usuario}/roles/sincronizar', [UsuarioRolController::class, 'sincronizarRoles']);

    // Horarios
    Route::apiResource('horarios', HorarioController::class, ['only' => ['index', 'show', 'store', 'update']]);
    Route::post('/horarios/generar', [HorarioController::class, 'generar']);
    Route::get('/horarios/docente/actual', [HorarioController::class, 'horarioDocente']);
    Route::patch('/horarios/{horario}/estado', [HorarioController::class, 'actualizarEstado']);
    Route::delete('/horarios/{horario}', [HorarioController::class, 'destroy']);

    // Asistencia
    Route::apiResource('asistencias', AsistenciaController::class, ['only' => ['index', 'show', 'destroy']]);
    Route::post('/asistencias/generar-qr', [AsistenciaController::class, 'generarQR']);
    Route::post('/asistencias/registrar-qr', [AsistenciaController::class, 'registrarQR']);
    Route::post('/asistencias/confirmar-virtual', [AsistenciaController::class, 'confirmarVirtual']);
    Route::post('/asistencias/registrar-manual', [AsistenciaController::class, 'registrarManual']);
    Route::get('/asistencias/docente/{docente_id}', [AsistenciaController::class, 'asistenciaDocente']);

    // Bitácora y Auditoría
    Route::get('/bitacora', [BitacoraController::class, 'index']);
    Route::get('/bitacora/{bitacora}', [BitacoraController::class, 'show']);
    Route::get('/bitacora/resumen/por-tabla', [BitacoraController::class, 'resumenPorTabla']);
    Route::get('/bitacora/usuario/actividad', [BitacoraController::class, 'actividadPorUsuario']);
    Route::get('/bitacora/cambios/historial', [BitacoraController::class, 'cambiosDelRegistro']);
    Route::post('/bitacora/limpiar', [BitacoraController::class, 'limpiar']);
});

Route::fallback(function () {
    return response()->json(['error' => 'Endpoint no encontrado'], 404);
});