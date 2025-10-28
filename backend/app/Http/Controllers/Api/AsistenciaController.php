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

            DB::beginTransaction();

            // Generar hash único para el QR
            $codigo_hash = hash('sha256',
                $validated['horario_asignado_id'] . '_' .
                now()->timestamp . '_' .
                Str::random(32)
            );

            // Crear registro en tabla codigo_qr_asistencia
            $qr = CodigoQRAsistencia::create([
                'horario_asignado_id' => $validated['horario_asignado_id'],
                'codigo_hash' => $codigo_hash,
                'fecha_hora_generacion' => now(),
                'fecha_hora_expiracion' => now()->addMinutes(30), // Expira en 30 min
                'utilizado' => false,
            ]);

            DB::commit();

            // Generar imagen QR usando servicio externo
            $qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' .
                urlencode($codigo_hash);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $qr->id,
                    'codigo_hash' => $codigo_hash,
                    'fecha_generacion' => $qr->fecha_hora_generacion,
                    'fecha_expiracion' => $qr->fecha_hora_expiracion,
                    'qr_image_url' => $qrImageUrl,
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

            // Buscar el código QR en la BD
            $qrRecord = CodigoQRAsistencia::where('codigo_hash', $validated['codigo_qr'])
                ->firstOrFail();

            // Validar que NO haya sido utilizado
            if ($qrRecord->utilizado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este código QR ya ha sido utilizado'
                ], 422);
            }

            // Validar que NO haya expirado
            if (now() > $qrRecord->fecha_hora_expiracion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este código QR ha expirado'
                ], 422);
            }

            $horarioAsignado = $qrRecord->horarioAsignado;

            // Obtener docente autenticado
            $usuarioActual = auth()->user();
            $docente = Docente::whereHas('persona.usuario', function ($query) use ($usuarioActual) {
                $query->where('usuario_id', $usuarioActual->id);
            })->firstOrFail();

            // Validar que el docente sea el asignado a esta clase
            if ($docente->persona_id != $horarioAsignado->docente_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para confirmar asistencia de otra clase'
                ], 403);
            }

            // Crear registro de asistencia
            $asistencia = Asistencia::create([
                'horario_asignado_id' => $horarioAsignado->id,
                'docente_id' => $docente->persona_id,
                'fecha_hora_registro' => now(),
                'estado_id' => 1, // Presente
                'metodo_registro_id' => 1, // QR
                'codigo_qr_id' => $qrRecord->id,
                'registrado_por_id' => $usuarioActual->id,
            ]);

            // Marcar QR como utilizado
            $qrRecord->update(['utilizado' => true]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'asistencia_id' => $asistencia->id,
                    'estado' => 'Presente',
                    'hora_registro' => $asistencia->fecha_hora_registro,
                    'horario' => $horarioAsignado->load('grupo.materia', 'bloqueHorario', 'aula'),
                ],
                'message' => 'Asistencia registrada exitosamente'
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Código QR no válido o no encontrado'
            ], 404);
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
     * CU15 - Confirmar Asistencia Virtual
     */
    public function confirmarVirtual(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'horario_asignado_id' => 'required|exists:horario_asignado,id',
            ], [
                'horario_asignado_id.required' => 'El ID del horario asignado es requerido',
                'horario_asignado_id.exists' => 'El horario asignado no existe',
            ]);

            DB::beginTransaction();

            $horario = HorarioAsignado::findOrFail($validated['horario_asignado_id']);

            // Validar que sea modalidad Virtual
            if ($horario->modalidad_id != 2) { // 2 = Virtual
                return response()->json([
                    'success' => false,
                    'message' => 'Esta clase no está marcada como Virtual Autorizado'
                ], 400);
            }

            // Validar ventana de tiempo (±15 minutos del inicio del bloque)
            $bloqueHorario = $horario->bloqueHorario;
            $ahora = now();

            // Parsear hora de inicio del bloque
            [$horas, $minutos] = explode(':', $bloqueHorario->hora_inicio);
            $inicioBloque = now()->setHour((int)$horas)->setMinute((int)$minutos)->setSecond(0);

            $diferenciaMinutos = abs($ahora->diffInMinutes($inicioBloque, false));

            if ($diferenciaMinutos > 15) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo puedes confirmar asistencia en la ventana de ±15 minutos de la hora de clase'
                ], 422);
            }

            // Obtener docente autenticado
            $usuarioActual = auth()->user();
            $docente = Docente::whereHas('persona.usuario', function ($query) use ($usuarioActual) {
                $query->where('usuario_id', $usuarioActual->id);
            })->firstOrFail();

            // Validar que el docente sea el asignado a esta clase
            if ($docente->persona_id != $horario->docente_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para confirmar asistencia de otra clase'
                ], 403);
            }

            // Crear registro de asistencia
            $asistencia = Asistencia::create([
                'horario_asignado_id' => $horario->id,
                'docente_id' => $docente->persona_id,
                'fecha_hora_registro' => now(),
                'estado_id' => 1, // Presente
                'metodo_registro_id' => 4, // Confirmación Virtual
                'registrado_por_id' => $usuarioActual->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'asistencia_id' => $asistencia->id,
                    'estado' => 'Presente',
                    'hora_registro' => $asistencia->fecha_hora_registro,
                    'modalidad' => 'Virtual',
                    'horario' => $horario->load('grupo.materia', 'aula', 'docente.persona'),
                ],
                'message' => 'Asistencia virtual confirmada exitosamente'
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'El horario asignado no existe'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar asistencia virtual',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}