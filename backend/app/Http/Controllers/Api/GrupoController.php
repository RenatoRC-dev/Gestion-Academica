<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grupo;
use App\Models\HorarioAsignado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GrupoController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $grupos = Grupo::with(['materia', 'periodo'])->paginate(15);
            return response()->json([
                'success' => true,
                'data' => $grupos,
                'message' => 'Grupos obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener grupos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'materia_id' => 'required|exists:materia,id',
                'periodo_id' => 'required|exists:periodo_academico,id',
                'codigo' => 'required|string|max:50',
                'cantidad_maxima' => 'required|integer|min:1|max:100',
                'cantidad_minima' => 'nullable|integer|min:0|max:100',
            ], [
                'codigo.required' => 'El código es requerido',
                'cantidad_maxima.required' => 'La cantidad máxima es requerida',
                'materia_id.exists' => 'La materia no existe',
                'periodo_id.exists' => 'El período no existe',
            ]);

            DB::beginTransaction();

            // Validar combinación única
            $existe = Grupo::where('materia_id', $validated['materia_id'])
                ->where('periodo_academico_id', $validated['periodo_id'])
                ->where('codigo_grupo', $validated['codigo'])
                ->first();

            if ($existe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un grupo con esta combinación materia-período-código'
                ], 409);
            }

            $grupo = Grupo::create([
                'materia_id' => $validated['materia_id'],
                'periodo_academico_id' => $validated['periodo_id'],
                'codigo_grupo' => $validated['codigo'],
                'cupo_maximo' => $validated['cantidad_maxima'],
                'cupo_minimo' => $validated['cantidad_minima'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $grupo->load(['materia', 'periodo']),
                'message' => 'Grupo creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Grupo $grupo): JsonResponse
    {
        try {
            $grupo->load(['materia', 'periodo']);
            return response()->json([
                'success' => true,
                'data' => $grupo,
                'message' => 'Grupo obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Grupo $grupo): JsonResponse
    {
        try {
            $validated = $request->validate([
                'codigo' => 'sometimes|string|max:50',
                'cantidad_maxima' => 'sometimes|integer|min:1|max:100',
                'cantidad_minima' => 'nullable|integer|min:0|max:100',
            ]);

            DB::beginTransaction();

            $grupo->update(array_filter([
                'codigo_grupo' => $validated['codigo'] ?? null,
                'cupo_maximo' => $validated['cantidad_maxima'] ?? null,
                'cupo_minimo' => $validated['cantidad_minima'] ?? null,
            ], fn($val) => $val !== null));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $grupo->fresh()->load(['materia', 'periodo']),
                'message' => 'Grupo actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Grupo $grupo): JsonResponse
    {
        try {
            // ✅ CORRECCIÓN: Validar que NO tenga horarios asignados
            if (HorarioAsignado::where('grupo_id', $grupo->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un grupo que tiene horarios asignados'
                ], 422);
            }

            DB::beginTransaction();
            $grupo->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Grupo eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
