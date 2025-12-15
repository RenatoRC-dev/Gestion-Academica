<?php

namespace App\Http\Controllers\Api\GestionHorarios;

use App\Http\Controllers\Controller;
use App\Models\BloqueHorario;
use App\Models\HorarioAsignado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BloqueHorarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) {
                $perPage = 15;
            }
            $bloques = BloqueHorario::with(['dia', 'horario'])->paginate($perPage);
            return response()->json([
                'success' => true,
                'data' => $bloques,
                'message' => 'Bloques horarios obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bloques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'dia_id' => 'required|integer|in:1,2,3,4,5,6,7',
                'horario_id' => 'required|exists:horario,id',
                'activo' => 'nullable|boolean',
            ], [
                'dia_id.required' => 'El día es requerido',
                'dia_id.in' => 'El día debe ser entre 1 (Lunes) y 7 (Domingo)',
                'horario_id.required' => 'El horario es requerido',
                'horario_id.exists' => 'El horario no existe',
            ]);

            DB::beginTransaction();

            // Verificar que no exista combinación día-horario
            $existente = BloqueHorario::where('dia_id', $validated['dia_id'])
                ->where('horario_id', $validated['horario_id'])
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un bloque horario para este día y horario'
                ], 409);
            }

            $bloque = BloqueHorario::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $bloque->load(['dia', 'horario']),
                'message' => 'Bloque horario creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(BloqueHorario $bloqueHorario): JsonResponse
    {
        try {
            $bloqueHorario->load(['dia', 'horario']);
            return response()->json([
                'success' => true,
                'data' => $bloqueHorario,
                'message' => 'Bloque horario obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, BloqueHorario $bloqueHorario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'dia_id' => 'sometimes|required|integer|in:1,2,3,4,5,6,7',
                'horario_id' => 'sometimes|required|exists:horario,id',
                'activo' => 'sometimes|required',
            ]);

            // Si solo se envía activo (toggle)
            if (count($validated) === 1 && isset($validated['activo'])) {
                $nuevoActivo = filter_var($validated['activo'], FILTER_VALIDATE_BOOLEAN);

                $bloqueHorario->activo = $nuevoActivo;
                $bloqueHorario->save();

                return response()->json([
                    'success' => true,
                    'data' => $bloqueHorario->load(['dia', 'horario']),
                    'message' => 'Bloque horario actualizado exitosamente'
                ], 200);
            }

            // Verificar combinación día-horario única si se cambian
            if (isset($validated['dia_id']) || isset($validated['horario_id'])) {
                $diaId = $validated['dia_id'] ?? $bloqueHorario->dia_id;
                $horarioId = $validated['horario_id'] ?? $bloqueHorario->horario_id;

                $existente = BloqueHorario::where('dia_id', $diaId)
                    ->where('horario_id', $horarioId)
                    ->where('id', '!=', $bloqueHorario->id)
                    ->first();

                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe un bloque horario para este día y horario'
                    ], 409);
                }
            }

            // Actualizar con fill (no update) para evitar problemas con timestamps
            $bloqueHorario->fill($validated);
            $bloqueHorario->save();

            return response()->json([
                'success' => true,
                'data' => $bloqueHorario->load(['dia', 'horario']),
                'message' => 'Bloque horario actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(BloqueHorario $bloqueHorario): JsonResponse
    {
        // Validar que NO esté en uso en horarios asignados ANTES de la transacción
        $enUso = HorarioAsignado::where('bloque_horario_id', $bloqueHorario->id)->exists();

        if ($enUso) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un bloque horario que está en uso en horarios asignados'
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Eliminar directamente
            $bloqueHorario->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bloque horario eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
