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
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\UsuarioRolController;
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
    Route::apiResource('materias', MateriaController::class);
    Route::apiResource('aulas', AulaController::class);
    Route::apiResource('grupos', GrupoController::class);
    Route::apiResource('periodos', PeriodoController::class);
    Route::apiResource('bloques-horarios', BloqueHorarioController::class);

    // Roles y Usuarios
    Route::apiResource('usuarios', UsuarioController::class);
    Route::apiResource('roles', RolController::class);
    Route::get('/usuarios/{usuario}/roles', [UsuarioRolController::class, 'rolesDelUsuario']);
    Route::post('/usuarios/{usuario}/roles/asignar', [UsuarioRolController::class, 'asignarRol']);
    Route::post('/usuarios/{usuario}/roles/revocar', [UsuarioRolController::class, 'revocarRol']);

    // Horarios - CU10, CU11, CU12
    Route::prefix('horarios')->group(function () {
        Route::get('/', [HorarioController::class, 'index']);                           // CU11 Listar
        Route::get('/{horarioAsignado}', [HorarioController::class, 'show']);           // CU11 Detalle
        Route::put('/{horarioAsignado}', [HorarioController::class, 'update']);         // CU12 Modificar
        Route::delete('/{horarioAsignado}', [HorarioController::class, 'destroy']);     // CU12 Eliminar
        Route::post('/generar', [HorarioController::class, 'generar']);                 // CU10 Generar Auto
        Route::get('/docente/{docenteId}', [HorarioController::class, 'porDocente']);   // CU11 Por docente
        Route::get('/aula/{aulaId}', [HorarioController::class, 'porAula']);            // CU11 Por aula
        Route::get('/grupo/{grupoId}', [HorarioController::class, 'porGrupo']);         // CU11 Por grupo
    });

    // Asistencia - CU13, CU14, CU15
    Route::prefix('asistencias')->group(function () {
        Route::get('/', [AsistenciaController::class, 'index']);                        // Listar
        Route::get('/{asistencia}', [AsistenciaController::class, 'show']);             // Detalle
        Route::post('/generar-qr', [AsistenciaController::class, 'generarQR']);         // CU13 Generar QR
        Route::post('/escanear-qr', [AsistenciaController::class, 'escanearQR']);       // CU14 Escanear QR
        Route::post('/confirmar-virtual', [AsistenciaController::class, 'confirmarVirtual']); // CU15 Virtual
    });

    // Bitácora - CU27
    Route::get('/bitacora', [BitacoraController::class, 'index']);
    Route::get('/bitacora/{bitacora}', [BitacoraController::class, 'show']);
});

Route::fallback(function () {
    return response()->json(['error' => 'Endpoint no encontrado'], 404);
});