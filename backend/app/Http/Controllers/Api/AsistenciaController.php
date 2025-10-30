<?php

namespace App\Http\Controllers\Api;

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

class AsistenciaController extends Controller
{
    /**
     * CU11 - Listar Asistencias
     */
    public function index(): JsonResponse
    {
        try {
            $asistencias = Asistencia::with([
                'horarioAsignado.grupo.materia',
                'docente.persona',
                'estado',
                'metodoRegistro',
                'codigoQR'
            ])->paginate(15);

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
                'fecha_hora_expiracion' => now()->addMinutes(10), // CHG: 1 minuto para pruebas
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

            $bloqueHorario = $horario->bloqueHorario;
            if (!$bloqueHorario || !$bloqueHorario->horario) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'El bloque horario no está correctamente configurado'
                ], 400);
            }

            $ahora = now();
            $horaInicioStr = (string) $bloqueHorario->horario->hora_inicio;
            [$h, $m] = explode(':', $horaInicioStr);
            $inicioBloque = now()->setHour((int)$h)->setMinute((int)$m)->setSecond(0);

            if (abs($ahora->diffInMinutes($inicioBloque, false)) > 15) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Solo puedes confirmar asistencia en la ventana de ±15 minutos de la hora de clase'
                ], 422);
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
}