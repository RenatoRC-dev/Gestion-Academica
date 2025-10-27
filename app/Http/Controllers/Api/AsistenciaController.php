<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asistencia;
use App\Models\CodigoQRAsistencia;
use App\Models\HorarioAsignado;
use App\Models\EstadoAsistencia;
use App\Models\MetodoRegistroAsistencia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AsistenciaController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $asistencias = Asistencia::with(['horarioAsignado', 'docente', 'estado', 'metodoRegistro'])
                ->paginate(15);

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
     * Generar código QR para una clase - CAMPOS CORRECTOS
     */
    public function generarQR(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'horario_asignado_id' => 'required|exists:horario_asignado,id',
            ]);

            // Invalidar QR anterior
            CodigoQRAsistencia::where('horario_asignado_id', $validated['horario_asignado_id'])
                ->where('utilizado', false)
                ->update(['utilizado' => true]);

            // Generar código único
            $codigoHash = hash('sha256', Str::random(32) . time());

            // Crear QR con CAMPOS CORRECTOS
            $qr = CodigoQRAsistencia::create([
                'horario_asignado_id' => $validated['horario_asignado_id'],
                'codigo_hash' => $codigoHash,  // ← CORRECTO
                'fecha_hora_generacion' => now(),  // ← CORRECTO
                'fecha_hora_expiracion' => now()->addMinutes(15),  // ← CORRECTO
                'utilizado' => false,  // ← CORRECTO
            ]);

            // Generar QR image (simulado)
            $qrImage = $this->generarImagenQR($codigoHash);

            return response()->json([
                'success' => true,
                'data' => [
                    'codigo_hash' => $codigoHash,
                    'qr_image' => $qrImage,
                    'expira_en' => $qr->fecha_hora_expiracion,
                    'horario_asignado_id' => $qr->horario_asignado_id,
                ],
                'message' => 'Código QR generado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar QR',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar asistencia por QR - CAMPOS CORRECTOS
     */
    public function registrarQR(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'codigo_hash' => 'required|string',  // ← CORRECTO: codigo_hash
            ]);

            // Buscar código QR vigente
            $qr = CodigoQRAsistencia::where('codigo_hash', $validated['codigo_hash'])
                ->where('utilizado', false)
                ->where('fecha_hora_expiracion', '>', now())
                ->first();

            if (!$qr) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código QR no válido o expirado'
                ], 404);
            }

            // Obtener horario asignado
            $horarioAsignado = $qr->horarioAsignado;

            // Verificar si ya existe asistencia
            $asistenciaExistente = Asistencia::where('docente_id', $horarioAsignado->docente_id)
                ->where('horario_asignado_id', $horarioAsignado->id)
                ->whereDate('fecha_hora_registro', today())
                ->first();

            if ($asistenciaExistente) {
                return response()->json([
                    'success' => false,
                    'message' => 'La asistencia ya fue registrada para esta clase'
                ], 409);
            }

            // Estado "Presente"
            $estadoPresente = EstadoAsistencia::where('nombre', 'Presente')->first();
            $metodoQR = MetodoRegistroAsistencia::where('nombre', 'QR')->first();

            // Registrar asistencia con CAMPOS CORRECTOS
            $asistencia = Asistencia::create([
                'docente_id' => $horarioAsignado->docente_id,
                'horario_asignado_id' => $horarioAsignado->id,
                'fecha_hora_registro' => now(),  // ← CORRECTO
                'estado_id' => $estadoPresente->id,  // ← CORRECTO
                'metodo_registro_id' => $metodoQR->id,  // ← CORRECTO
                'codigo_qr_id' => $qr->id,  // ← AÑADIDO
                'registrado_por_id' => auth()->user()->id ?? 1,  // ← AÑADIDO: usuario autenticado o admin
            ]);

            // Marcar QR como utilizado
            $qr->update(['utilizado' => true]);

            return response()->json([
                'success' => true,
                'data' => $asistencia->load(['docente', 'estado', 'metodoRegistro']),
                'message' => 'Asistencia registrada exitosamente'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirmar asistencia virtual
     */
    public function confirmarVirtual(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'horario_asignado_id' => 'required|exists:horario_asignado,id',
            ]);

            $horarioAsignado = HorarioAsignado::with('modalidad')->find($validated['horario_asignado_id']);

            // Verificar que es clase virtual
            if ($horarioAsignado->modalidad->nombre !== 'Virtual') {
                return response()->json([
                    'success' => false,
                    'message' => 'La clase no está marcada como Virtual'
                ], 409);
            }

            // Verificar si ya existe
            $asistenciaExistente = Asistencia::where('docente_id', $horarioAsignado->docente_id)
                ->where('horario_asignado_id', $horarioAsignado->id)
                ->whereDate('fecha_hora_registro', today())
                ->first();

            if ($asistenciaExistente) {
                return response()->json([
                    'success' => false,
                    'message' => 'La asistencia ya fue confirmada'
                ], 409);
            }

            $estadoVirtual = EstadoAsistencia::where('nombre', 'Virtual Autenticado')->first();
            $metodoVirtual = MetodoRegistroAsistencia::where('nombre', 'Confirmación Virtual')->first();

            $asistencia = Asistencia::create([
                'docente_id' => $horarioAsignado->docente_id,
                'horario_asignado_id' => $horarioAsignado->id,
                'fecha_hora_registro' => now(),
                'estado_id' => $estadoVirtual->id,
                'metodo_registro_id' => $metodoVirtual->id,
                'registrado_por_id' => auth()->user()->id ?? 1,  // ← AÑADIDO
            ]);

            return response()->json([
                'success' => true,
                'data' => $asistencia->load(['docente', 'estado']),
                'message' => 'Asistencia virtual confirmada exitosamente'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar asistencia manual
     */
    public function registrarManual(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'docente_id' => 'required|exists:docente,persona_id',  // ← persona_id
                'horario_asignado_id' => 'required|exists:horario_asignado,id',
                'estado_nombre' => 'required|string|in:Presente,Ausente,Justificado,Retraso',
            ]);

            $estado = EstadoAsistencia::where('nombre', $validated['estado_nombre'])->first();
            $metodoManual = MetodoRegistroAsistencia::where('nombre', 'Manual')->first();

            $asistencia = Asistencia::create([
                'docente_id' => $validated['docente_id'],
                'horario_asignado_id' => $validated['horario_asignado_id'],
                'fecha_hora_registro' => now(),
                'estado_id' => $estado->id,
                'metodo_registro_id' => $metodoManual->id,
                'registrado_por_id' => auth()->user()->id ?? null,  // Usuario que registra
            ]);

            return response()->json([
                'success' => true,
                'data' => $asistencia->load(['docente', 'estado']),
                'message' => 'Asistencia registrada manualmente'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias de un docente
     */
    public function asistenciaDocente(Request $request): JsonResponse
    {
        try {
            $docenteId = $request->get('docente_id');

            if (!$docenteId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debe proporcionar docente_id (persona_id)'
                ], 400);
            }

            $asistencias = Asistencia::where('docente_id', $docenteId)
                ->with(['horarioAsignado.grupo.materia', 'estado', 'metodoRegistro'])
                ->orderBy('fecha_hora_registro', 'desc')
                ->get();

            $total = $asistencias->count();
            $presentes = $asistencias->where('estado.nombre', 'Presente')->count();
            $ausentes = $asistencias->where('estado.nombre', 'Ausente')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'asistencias' => $asistencias,
                    'estadisticas' => [
                        'total' => $total,
                        'presentes' => $presentes,
                        'ausentes' => $ausentes,
                        'porcentaje_asistencia' => $total > 0 ? round(($presentes / $total) * 100, 2) : 0,
                    ]
                ],
                'message' => 'Asistencias del docente obtenidas'
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
     * Generar imagen QR (simulado)
     */
    private function generarImagenQR($codigo): string
    {
        return 'data:image/svg+xml;base64,' . base64_encode(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' .
            '<rect width="200" height="200" fill="white"/>' .
            '<text x="50" y="100" font-size="16" font-family="Arial">' . substr($codigo, 0, 20) . '</text>' .
            '</svg>'
        );
    }

    public function destroy(Asistencia $asistencia): JsonResponse
    {
        try {
            $asistencia->delete();
            return response()->json([
                'success' => true,
                'message' => 'Asistencia eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar asistencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}