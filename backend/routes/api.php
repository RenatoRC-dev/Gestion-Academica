<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocenteController;
use App\Http\Controllers\Api\AdministrativoController;
use App\Http\Controllers\Api\MateriaController;
use App\Http\Controllers\Api\AulaController;
use App\Http\Controllers\Api\GrupoController;
use App\Http\Controllers\Api\PeriodoController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\AsistenciaController;
use App\Http\Controllers\Api\BloqueHorarioController;
use App\Http\Controllers\Api\AreaAcademicaController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\UsuarioRolController;
use App\Http\Controllers\Api\BitacoraController;
use App\Http\Controllers\Api\DiaController;
use App\Http\Controllers\Api\HorarioFranjaController;

// Rutas públicas
// Corrección: Rate limiting contra fuerza bruta (5 intentos por minuto)
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/password/recuperar', [AuthController::class, 'recoverPassword'])->middleware('throttle:5,1');


// Rutas protegidas (requieren token)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/user/password', [AuthController::class, 'changePassword']);

    // CRUD Entidades Maestras
    Route::apiResource('docentes', DocenteController::class);
    Route::apiResource('materias', MateriaController::class);
    Route::apiResource('aulas', AulaController::class);
    Route::apiResource('grupos', GrupoController::class);
    Route::apiResource('administrativos', AdministrativoController::class);
    Route::apiResource('periodos', PeriodoController::class);
    Route::apiResource('bloques-horarios', BloqueHorarioController::class);
    Route::apiResource('areas-academicas', AreaAcademicaController::class);

    // Catálogos para bloques horarios
    Route::get('/dias', [DiaController::class, 'index']);
    Route::get('/horarios-franja', [HorarioFranjaController::class, 'index']);

    // Roles y Usuarios
    Route::apiResource('usuarios', UsuarioController::class);
    Route::apiResource('roles', RolController::class);
    Route::get('/usuarios/{usuario}/roles', [UsuarioRolController::class, 'rolesDelUsuario']);
    Route::post('/usuarios/{usuario}/roles/asignar', [UsuarioRolController::class, 'asignarRol']);
    Route::post('/usuarios/{usuario}/roles/revocar', [UsuarioRolController::class, 'revocarRol']);

    // Horarios - CU10, CU11, CU12
    Route::prefix('horarios')->group(function () {
        Route::get('/', [HorarioController::class, 'index']);
        Route::get('/calendario-docente', [HorarioController::class, 'calendarioDocente']);
        Route::get('/virtuales-docente', [HorarioController::class, 'virtualesDocente']);
        Route::get('/{horarioAsignado}', [HorarioController::class, 'show']);
        Route::get('/{horarioAsignado}/calendario', [HorarioController::class, 'calendario']);
        Route::put('/{horarioAsignado}', [HorarioController::class, 'update']);
        Route::delete('/{horarioAsignado}', [HorarioController::class, 'destroy']);
        Route::post('/generar', [HorarioController::class, 'generar']);
        Route::get('/docente/{docenteId}', [HorarioController::class, 'porDocente']);
        Route::get('/aula/{aulaId}', [HorarioController::class, 'porAula']);
        Route::get('/grupo/{grupoId}', [HorarioController::class, 'porGrupo']);
        Route::get('/periodo/{periodoId}', [HorarioController::class, 'porPeriodo']);
    });

    // Asistencia - CU13, CU14, CU15
    Route::prefix('asistencias')->group(function () {
        Route::get('/', [AsistenciaController::class, 'index']);
        Route::get('/{asistencia}', [AsistenciaController::class, 'show']);
        Route::post('/generar-qr', [AsistenciaController::class, 'generarQR']);
        Route::post('/escanear-qr', [AsistenciaController::class, 'escanearQR']);
        Route::post('/confirmar-virtual', [AsistenciaController::class, 'confirmarVirtual']);
    });

    // Bitácora - CU27
    Route::get('/bitacora', [BitacoraController::class, 'index']);
    Route::get('/bitacora/{bitacora}', [BitacoraController::class, 'show']);

    // Métricas del sistema
    Route::get('/metricas', [App\Http\Controllers\Api\MetricasController::class, 'obtenerMetricasGenerales']);
});

    Route::fallback(function () {
        return response()->json(['error' => 'Endpoint no encontrado'], 404);
    });
