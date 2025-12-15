<?php

namespace App\Http\Controllers\Api\GestionAsistencia;

use App\Http\Controllers\Controller;
use App\Models\Asistencia;
use App\Models\CodigoQRAsistencia;
use App\Models\HorarioAsignado;
use App\Models\Docente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\CarbonInterface;

class AsistenciaController extends Controller
{
    /**
     * CU11, CU16, CU17, CU18 - Listar Asistencias con filtros avanzados
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) {
                $perPage = 15;
            }

            $query = Asistencia::with([
                'horarioAsignado.grupo.materia',
                'horarioAsignado.bloqueHorario.dia',
                'horarioAsignado.bloqueHorario.horario',
                'horarioAsignado.periodo',
                'docente.persona',
                'estado',
                'metodoRegistro',
                'codigoQR'
            ]);

            // Filtros
            if ($request->filled('docente_id')) {
                $query->where('docente_id', $request->query('docente_id'));
            }

            if ($request->filled('estado_id')) {
                $query->where('estado_id', $request->query('estado_id'));
            }

            if ($request->filled('metodo_registro_id')) {
                $query->where('metodo_registro_id', $request->query('metodo_registro_id'));
            }

            if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
                $query->whereBetween('fecha_hora_registro', [
                    $request->query('fecha_inicio') . ' 00:00:00',
                    $request->query('fecha_fin') . ' 23:59:59'
                ]);
            }

            // Filtro por periodo a través de horario_asignado
            if ($request->filled('periodo_id')) {
                $query->whereHas('horarioAsignado', function ($q) use ($request) {
                    $q->where('periodo_academico_id', $request->query('periodo_id'));
                });
            }

            // Filtro por grupo
            if ($request->filled('grupo_id')) {
                $query->whereHas('horarioAsignado', function ($q) use ($request) {
                    $q->where('grupo_id', $request->query('grupo_id'));
                });
            }

            // Filtro por materia
            if ($request->filled('materia_id')) {
                $query->whereHas('horarioAsignado.grupo', function ($q) use ($request) {
                    $q->where('materia_id', $request->query('materia_id'));
                });
            }

            $asistencias = $query->orderBy('fecha_hora_registro', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $asistencias,
                'message' => 'Asistencias obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU11 - Ver detalle de asistencia
     */
    public function show(Asistencia $asistencia): JsonResponse
    {
        try {
            $asistencia->load([
                'horarioAsignado.grupo.materia',
                'docente.persona',
                'estado',
                'metodoRegistro',
                'codigoQR'
            ]);

            return response()->json([
                'success' => true,
                'data' => $asistencia,
                'message' => 'Asistencia obtenida exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU18 - Registrar asistencia manualmente (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'horario_asignado_id' => 'required|exists:horario_asignado,id',
                'docente_id' => 'required|exists:docente,persona_id',
                'estado_id' => 'required|exists:estado_asistencia,id',
                'fecha_hora_registro' => 'required|date',
                'observaciones' => 'nullable|string|max:500',
            ], [
                'horario_asignado_id.required' => 'El horario asignado es requerido',
                'horario_asignado_id.exists' => 'El horario asignado no existe',
                'docente_id.required' => 'El docente es requerido',
                'docente_id.exists' => 'El docente no existe',
                'estado_id.required' => 'El estado es requerido',
                'estado_id.exists' => 'El estado no existe',
                'fecha_hora_registro.required' => 'La fecha y hora son requeridas',
                'fecha_hora_registro.date' => 'La fecha y hora deben ser válidas',
            ]);

            DB::beginTransaction();

            // Validar que no exista duplicado
            $existe = Asistencia::where('horario_asignado_id', $validated['horario_asignado_id'])
                ->where('docente_id', $validated['docente_id'])
                ->whereDate('fecha_hora_registro', substr($validated['fecha_hora_registro'], 0, 10))
                ->exists();

            if ($existe) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un registro de asistencia para este docente en esta clase y fecha'
                ], 422);
            }

            $usuarioActual = auth()->user();

            // Crear asistencia manual
            $asistencia = Asistencia::create([
                'horario_asignado_id' => $validated['horario_asignado_id'],
                'docente_id' => $validated['docente_id'],
                'fecha_hora_registro' => $validated['fecha_hora_registro'],
                'estado_id' => $validated['estado_id'],
                'metodo_registro_id' => 3, // Registro Manual Admin
                'observaciones' => $validated['observaciones'] ?? null,
                'registrado_por_id' => $usuarioActual->id,
            ]);

            $asistencia->load([
                'horarioAsignado.grupo.materia',
                'docente.persona',
                'estado',
                'metodoRegistro'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $asistencia,
                'message' => 'Asistencia registrada exitosamente'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU18 - Modificar asistencia existente (Admin)
     */
    public function update(Request $request, Asistencia $asistencia): JsonResponse
    {
        try {
            $validated = $request->validate([
                'estado_id' => 'sometimes|required|exists:estado_asistencia,id',
                'observaciones' => 'nullable|string|max:500',
            ], [
                'estado_id.exists' => 'El estado no existe',
            ]);

            DB::beginTransaction();

            $asistencia->fill($validated);
            $asistencia->save();

            $asistencia->load([
                'horarioAsignado.grupo.materia',
                'docente.persona',
                'estado',
                'metodoRegistro'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $asistencia,
                'message' => 'Asistencia actualizada exitosamente'
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU18 - Eliminar asistencia (Admin)
     */
    public function destroy(Asistencia $asistencia): JsonResponse
    {
        DB::beginTransaction();

        try {
            $asistencia->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Asistencia eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU13 - Generar Código QR de Asistencia
     */
    public function generarQR(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'horario_asignado_id' => 'required|exists:horario_asignado,id',
            ], [
                'horario_asignado_id.required' => 'El ID del horario asignado es requerido',
                'horario_asignado_id.exists' => 'El horario asignado no existe',
            ]);

            $horario = HorarioAsignado::findOrFail($validated['horario_asignado_id']);

            // Verificar que sea una clase presencial
        if ($horario->modalidad_id != 1) { // 1 = Presencial
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden generar QR para clases presenciales'
            ], 400);
        }

        // Validar bloque horario existente
        $bloqueHorario = $horario->bloqueHorario;
        if (!$bloqueHorario) {
            return response()->json([
                    'success' => false,
                    'message' => 'El bloque horario asociado no existe'
                ], 400);
            }

        DB::beginTransaction();

            if ($error = $this->validarCalendario($horario, now(), true)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $error
                ], 400);
            }

            // Hash único para el QR
            $codigo_hash = hash('sha256',
                $validated['horario_asignado_id'] . '_' .
                now()->timestamp . '_' .
                Str::random(32)
            );

            // TTL de 1 minuto para pruebas (luego vuelve a 30)
            $qr = CodigoQRAsistencia::create([
                'horario_asignado_id'   => $validated['horario_asignado_id'],
                'codigo_hash'           => $codigo_hash,
                'fecha_hora_generacion' => now(),
                'fecha_hora_expiracion' => now()->addMinutes(10),
                'utilizado'             => false,
            ]);

            DB::commit();

            $qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' .
                urlencode($codigo_hash);

            return response()->json([
                'success' => true,
                'data' => [
                    'id'                  => $qr->id,
                    'codigo_hash'         => $codigo_hash,
                    'fecha_generacion'    => $qr->fecha_hora_generacion,
                    'fecha_expiracion'    => $qr->fecha_hora_expiracion,
                    'qr_image_url'        => $qrImageUrl,
                    'horario_asignado_id' => $horario->id,
                ],
                'message' => 'Código QR generado exitosamente'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al generar QR',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU14 - Escanear Código QR y Registrar Asistencia
     * SOLUCIÓN DEFINITIVA: Comparación usando valores RAW de la BD
     */
    public function escanearQR(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'codigo_qr' => 'required|string',
            ], [
                'codigo_qr.required' => 'El código QR es requerido',
            ]);

            DB::beginTransaction();

            // Buscar QR por hash
            $qrRecord = CodigoQRAsistencia::where('codigo_hash', $validated['codigo_qr'])->first();

            if (!$qrRecord) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Código QR no válido o no encontrado'
                ], 404);
            }

            // SOLUCIÓN: Comparar usando query SQL directa para evitar problemas de timezone
            // Esto compara directamente en la base de datos sin conversiones de timezone
            $estaExpirado = DB::selectOne(
                "SELECT CASE WHEN fecha_hora_expiracion < NOW() THEN 1 ELSE 0 END as expirado 
                FROM codigo_qr_asistencia 
                WHERE id = ?",
                [$qrRecord->id]
            )->expirado;

            if ($estaExpirado) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Este código QR ha expirado'
                ], 422);
            }

            // Verificar si ya fue utilizado
            if ($qrRecord->utilizado) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Este código QR ya ha sido utilizado'
                ], 422);
            }

            // Consumo atómico - sin verificar expiración en el UPDATE
            $afectadas = CodigoQRAsistencia::whereKey($qrRecord->id)
                ->where('utilizado', false)
                ->update([
                    'utilizado'  => true,
                    'updated_at' => now(),
                ]);

            // Si no se actualizó, es por condición de carrera
            if ($afectadas === 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Este código QR ya ha sido utilizado (intento concurrente)'
                ], 422);
            }

            $horarioAsignado = $qrRecord->horarioAsignado;

            if ($error = $this->validarCalendario($horarioAsignado, now(), true)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $error
                ], 400);
            }

            // Usuario autenticado
            $usuarioActual = auth()->user();

            // Validar rol docente
            $tieneRolDocente = $usuarioActual->roles()->where('nombre', 'docente')->exists();
            if (!$tieneRolDocente) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Solo los docentes pueden registrar asistencia'
                ], 403);
            }

            // Perfil docente vinculado al usuario
            $docente = Docente::whereHas('persona.usuario', function ($q) use ($usuarioActual) {
                $q->where('usuario_id', $usuarioActual->id);
            })->first();

            if (!$docente) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró perfil de docente para este usuario'
                ], 403);
            }

            // Debe coincidir el docente de la clase
            if ($docente->persona_id != $horarioAsignado->docente_id) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para confirmar asistencia de otra clase'
                ], 403);
            }

            // Anti-duplicado
            $yaRegistrada = Asistencia::where('horario_asignado_id', $horarioAsignado->id)
                ->where('docente_id', $docente->persona_id)
                ->exists();

            if ($yaRegistrada) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'La asistencia de este docente ya fue registrada para esta clase'
                ], 422);
            }

            // Crear asistencia
            $asistencia = Asistencia::create([
                'horario_asignado_id' => $horarioAsignado->id,
                'docente_id'          => $docente->persona_id,
                'fecha_hora_registro' => now(),
                'estado_id'           => 1, // Presente
                'metodo_registro_id'  => 1, // QR
                'codigo_qr_id'        => $qrRecord->id,
                'registrado_por_id'   => $usuarioActual->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'asistencia_id' => $asistencia->id,
                    'estado'        => 'Presente',
                    'hora_registro' => $asistencia->fecha_hora_registro,
                    'horario'       => $horarioAsignado->load('grupo.materia', 'bloqueHorario', 'aula'),
                ],
                'message' => 'Asistencia registrada exitosamente'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar asistencia',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU15 - Confirmar Asistencia Virtual
     */
    public function confirmarVirtual(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'horario_asignado_id' => 'required|exists:horario_asignado,id',
            ], [
                'horario_asignado_id.required' => 'El ID del horario asignado es requerido',
                'horario_asignado_id.exists'   => 'El horario asignado no existe',
            ]);

            DB::beginTransaction();

            $horario = HorarioAsignado::findOrFail($validated['horario_asignado_id']);

            if ($horario->modalidad_id != 2) { // 2 = Virtual
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Esta clase no está marcada como Virtual Autorizado'
                ], 400);
            }

            if (!$horario->virtual_autorizado) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Esta clase aún no ha sido autorizada para sesión virtual'
                ], 400);
            }

            $bloqueHorario = $horario->bloqueHorario;
            if (!$bloqueHorario || !$bloqueHorario->horario) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'El bloque horario no está correctamente configurado'
                ], 400);
            }

            $ahora = now();
            if ($error = $this->validarCalendario($horario, $ahora, true)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $error
                ], 400);
            }

            $usuarioActual = auth()->user();
            $tieneRolDocente = $usuarioActual->roles()->where('nombre', 'docente')->exists();
            if (!$tieneRolDocente) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Solo los docentes pueden confirmar asistencia virtual'
                ], 403);
            }

            $docente = Docente::whereHas('persona.usuario', function ($q) use ($usuarioActual) {
                $q->where('usuario_id', $usuarioActual->id);
            })->first();

            if (!$docente) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró perfil de docente para este usuario'
                ], 403);
            }

            if ($docente->persona_id != $horario->docente_id) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para confirmar asistencia de otra clase'
                ], 403);
            }

            $yaRegistrada = Asistencia::where('horario_asignado_id', $horario->id)
                ->where('docente_id', $docente->persona_id)
                ->exists();

            if ($yaRegistrada) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'La asistencia de este docente ya fue registrada para esta clase'
                ], 422);
            }

            $asistencia = Asistencia::create([
                'horario_asignado_id' => $horario->id,
                'docente_id'          => $docente->persona_id,
                'fecha_hora_registro' => now(),
                'estado_id'           => 1, // Presente
                'metodo_registro_id'  => 4, // Confirmación Virtual
                'registrado_por_id'   => $usuarioActual->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'asistencia_id' => $asistencia->id,
                    'estado'        => 'Presente',
                    'hora_registro' => $asistencia->fecha_hora_registro,
                    'modalidad'     => 'Virtual',
                    'horario'       => $horario->load('grupo.materia', 'aula', 'docente.persona'),
                ],
                'message' => 'Asistencia virtual confirmada exitosamente'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar asistencia virtual',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retorna horarios del docente que están disponibles para registrar asistencia.
     */
    public function horariosDisponibles(Request $request): JsonResponse
    {
        try {
            $modalidad = (int) $request->query('modalidad', 1);
            $virtualAutorizado = $request->boolean('virtual_autorizado', true);

            $usuarioActual = auth()->user();
            $tieneRolDocente = $usuarioActual->roles()->where('nombre', 'docente')->exists();
            if (!$tieneRolDocente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo los docentes pueden consultar sus horarios disponibles'
                ], 403);
            }

            $docente = Docente::whereHas('persona.usuario', function ($q) use ($usuarioActual) {
                $q->where('usuario_id', $usuarioActual->id);
            })->first();

            if (!$docente) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró perfil de docente para este usuario'
                ], 404);
            }

            $query = HorarioAsignado::where('docente_id', $docente->persona_id)
                ->where('activo', true)
                ->with([
                    'grupo.materia',
                    'bloqueHorario.dia',
                    'bloqueHorario.horario',
                    'periodo',
                    'modalidad',
                    'aula'
                ]);

            if ($modalidad) {
                $query->where('modalidad_id', $modalidad);
            }

            if ($modalidad === 2 && $virtualAutorizado) {
                $query->where('virtual_autorizado', true);
            }

            $horarios = $query->get();
            $fechaActual = now();

            $disponibles = $horarios->filter(function ($horario) use ($fechaActual) {
                return $this->validarCalendario($horario, $fechaActual, true) === null;
            })->values();

            return response()->json([
                'success' => true,
                'data' => $disponibles,
                'message' => 'Horarios disponibles obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios disponibles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU16 - Historial de asistencia propio (Docente)
     */
    public function historialPropio(Request $request): JsonResponse
    {
        try {
            $usuarioActual = auth()->user();

            // Obtener perfil docente
            $docente = Docente::whereHas('persona.usuario', function ($q) use ($usuarioActual) {
                $q->where('usuario_id', $usuarioActual->id);
            })->first();

            if (!$docente) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró perfil de docente para este usuario'
                ], 403);
            }

            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) {
                $perPage = 15;
            }

            $query = Asistencia::with([
                'horarioAsignado.grupo.materia',
                'horarioAsignado.bloqueHorario.dia',
                'horarioAsignado.bloqueHorario.horario',
                'horarioAsignado.periodo',
                'estado',
                'metodoRegistro'
            ])->where('docente_id', $docente->persona_id);

            // Filtros opcionales
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha_hora_registro', [
                    $request->query('fecha_inicio') . ' 00:00:00',
                    $request->query('fecha_fin') . ' 23:59:59'
                ]);
            }

            if ($request->has('materia_id')) {
                $query->whereHas('horarioAsignado.grupo', function ($q) use ($request) {
                    $q->where('materia_id', $request->query('materia_id'));
                });
            }

            if ($request->has('estado_id')) {
                $query->where('estado_id', $request->query('estado_id'));
            }

            $asistencias = $query->orderBy('fecha_hora_registro', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $asistencias,
                'message' => 'Historial obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU17 - Historial general de asistencias (Admin/Autoridad)
     */
    public function historialGeneral(Request $request): JsonResponse
    {
        try {
            // Usar el método index existente que ya tiene todos los filtros
            return $this->index($request);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial general',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU16, CU17 - Estadísticas de asistencia
     */
    public function estadisticas(Request $request): JsonResponse
    {
        try {
            $usuarioActual = auth()->user();
            $esDocente = $usuarioActual->roles()->where('nombre', 'docente')->exists();

            $query = Asistencia::query();

            // Si es docente, solo sus asistencias
            if ($esDocente) {
                $docente = Docente::whereHas('persona.usuario', function ($q) use ($usuarioActual) {
                    $q->where('usuario_id', $usuarioActual->id);
                })->first();

                if (!$docente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se encontró perfil de docente'
                    ], 403);
                }

                $query->where('docente_id', $docente->persona_id);
            }

            // Filtros opcionales
            if ($request->has('docente_id')) {
                $query->where('docente_id', $request->query('docente_id'));
            }

            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha_hora_registro', [
                    $request->query('fecha_inicio') . ' 00:00:00',
                    $request->query('fecha_fin') . ' 23:59:59'
                ]);
            }

            if ($request->has('periodo_id')) {
                $query->whereHas('horarioAsignado', function ($q) use ($request) {
                    $q->where('periodo_academico_id', $request->query('periodo_id'));
                });
            }

            // Calcular estadísticas
            $totalClases = $query->count();
            $presentes = (clone $query)->whereHas('estado', function ($q) {
                $q->where('nombre', 'Presente');
            })->count();

            $faltas = (clone $query)->whereHas('estado', function ($q) {
                $q->where('cuenta_como_falta', true);
            })->count();

            $justificadas = (clone $query)->whereHas('estado', function ($q) {
                $q->where('nombre', 'LIKE', '%Justificada%');
            })->count();

            $porcentajeAsistencia = $totalClases > 0 ? round(($presentes / $totalClases) * 100, 2) : 0;

            // Por método de registro
            $porMetodo = DB::table('asistencia')
                ->join('metodo_registro_asistencia', 'asistencia.metodo_registro_id', '=', 'metodo_registro_asistencia.id')
                ->select('metodo_registro_asistencia.nombre', DB::raw('COUNT(*) as total'))
                ->groupBy('metodo_registro_asistencia.id', 'metodo_registro_asistencia.nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_clases' => $totalClases,
                    'presentes' => $presentes,
                    'faltas' => $faltas,
                    'justificadas' => $justificadas,
                    'porcentaje_asistencia' => $porcentajeAsistencia,
                    'por_metodo' => $porMetodo,
                ],
                'message' => 'Estadísticas obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function validarCalendario(HorarioAsignado $horario, CarbonInterface $fecha, bool $validarVentana = false): ?string
    {
        $horario->loadMissing(['bloqueHorario.dia', 'bloqueHorario.horario', 'periodo']);
        $bloqueHorario = $horario->bloqueHorario;
        $periodo = $horario->periodo;

        if (!$bloqueHorario || !$bloqueHorario->horario) {
            return 'El bloque horario asociado no está correctamente configurado';
        }
        if (!$periodo || !$periodo->fecha_inicio || !$periodo->fecha_fin) {
            return 'El periodo académico no está disponible para este horario';
        }

        $inicio = $periodo->fecha_inicio->startOfDay();
        $fin = $periodo->fecha_fin->endOfDay();

        if ($fecha->lessThan($inicio)) {
            return 'La fecha actual está antes del inicio del periodo académico';
        }
        if ($fecha->greaterThan($fin)) {
            return 'La fecha actual ya salió del periodo académico';
        }

        $diaEsperado = (int) $bloqueHorario->dia_id;
        if ($fecha->dayOfWeekIso !== $diaEsperado) {
            $nombre = $bloqueHorario->dia->nombre ?? 'el día correspondiente';
            return "Hoy no hay clase programada para este horario ($nombre)";
        }

        if ($validarVentana) {
            $horaInicioStr = (string) $bloqueHorario->horario->hora_inicio;
            if (str_contains($horaInicioStr, ':')) {
                [$h, $m] = explode(':', $horaInicioStr);
                $inicioBloque = $fecha->copy()->setHour((int) $h)->setMinute((int) $m)->setSecond(0);
                if (abs($fecha->diffInMinutes($inicioBloque, false)) > 15) {
                    return 'Solo puedes registrar o generar en la ventana de ±15 minutos de inicio de clase';
                }
            }
        }

        return null;
    }
}
