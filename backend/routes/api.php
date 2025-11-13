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
use App\Http\Controllers\Api\EstadoAsistenciaController;
use App\Http\Controllers\Api\MetodoRegistroAsistenciaController;
use App\Http\Controllers\Api\ReporteAsistenciaController;
use App\Http\Controllers\Api\ImportacionController;
use App\Http\Controllers\Api\AreaAdministrativaController;

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
    Route::get('/docentes/yo', [DocenteController::class, 'miPerfil']);
    Route::apiResource('docentes', DocenteController::class)
    ->parameters([
        'docentes' => 'docente',
    ]);
    Route::apiResource('materias', MateriaController::class)
    ->parameters([
        'materias' => 'materia',
    ]);
    Route::apiResource('aulas', AulaController::class)
    ->parameters([
        'aulas' => 'aula',
    ]);
    Route::apiResource('grupos', GrupoController::class)
    ->parameters([
        'grupos' => 'grupo',
    ]);
    Route::apiResource('administrativos', AdministrativoController::class)
    ->parameters([
        'administrativos' => 'administrativo',
    ]);
    Route::apiResource('periodos', PeriodoController::class)
    ->parameters([
        'periodos' => 'periodo',
    ]);
    Route::apiResource('bloques-horarios', BloqueHorarioController::class)
    ->parameters([
        'bloques-horarios' => 'bloqueHorario',
    ]);

    Route::apiResource('areas-academicas', AreaAcademicaController::class)
    ->parameters([
        'areas-academicas' => 'areaAcademica',
    ]);
    Route::apiResource('areas-administrativas', AreaAdministrativaController::class)
    ->parameters([
        'areas-administrativas' => 'areaAdministrativa',
    ]);


    // Catálogos para bloques horarios
    Route::get('/dias', [DiaController::class, 'index']);
    Route::get('/horarios-franja', [HorarioFranjaController::class, 'index']);

    // Roles y Usuarios
    Route::apiResource('usuarios', UsuarioController::class)
    ->parameters([
        'usuarios' => 'usuario',
    ]);
    Route::apiResource('roles', RolController::class)
    ->parameters([
        'roles' => 'rol',
    ]);
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

    // Asistencia - CU13, CU14, CU15, CU16, CU17, CU18
    Route::prefix('asistencias')->group(function () {
        Route::get('/horarios-disponibles', [AsistenciaController::class, 'horariosDisponibles']);
        Route::get('/', [AsistenciaController::class, 'index']);
        Route::get('/historial-propio', [AsistenciaController::class, 'historialPropio']);
        Route::get('/historial-general', [AsistenciaController::class, 'historialGeneral']);
        Route::get('/estadisticas', [AsistenciaController::class, 'estadisticas']);
        Route::get('/{asistencia}', [AsistenciaController::class, 'show']);
        Route::post('/', [AsistenciaController::class, 'store']);
        Route::put('/{asistencia}', [AsistenciaController::class, 'update']);
        Route::delete('/{asistencia}', [AsistenciaController::class, 'destroy']);
        Route::post('/generar-qr', [AsistenciaController::class, 'generarQR']);
        Route::post('/escanear-qr', [AsistenciaController::class, 'escanearQR']);
        Route::post('/confirmar-virtual', [AsistenciaController::class, 'confirmarVirtual']);
    });

    // Gestión de Catálogos de Asistencia - CU19, CU20
    Route::apiResource('estados-asistencia', EstadoAsistenciaController::class)
    ->parameters([
        'estados-asistencia' => 'estadoAsistencia',
    ]);
    Route::apiResource('metodos-registro', MetodoRegistroAsistenciaController::class)
    ->parameters([
        'metodos-registro' => 'metodoRegistro',
    ]);


    // Reportes de Asistencia - CU28, CU29, CU30
    Route::prefix('reportes/asistencia')->group(function () {
        Route::post('/generar', [ReporteAsistenciaController::class, 'generar']);
        Route::post('/exportar-pdf', [ReporteAsistenciaController::class, 'exportarPDF']);
        Route::post('/exportar-excel', [ReporteAsistenciaController::class, 'exportarExcel']);
    });

    // Importación Masiva - CU24
    Route::prefix('importaciones')->group(function () {
        Route::post('/validar', [ImportacionController::class, 'validar']);
        Route::post('/importar', [ImportacionController::class, 'importar']);
        Route::get('/historial', [ImportacionController::class, 'historial']);
        Route::get('/descargar-plantilla', [ImportacionController::class, 'descargarPlantilla']);
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
