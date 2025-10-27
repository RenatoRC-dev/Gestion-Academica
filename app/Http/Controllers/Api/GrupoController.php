<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grupo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                'codigo_grupo' => 'required|string|max:50|unique:grupo,codigo_grupo',
                'materia_id' => 'required|exists:materia,id',
                'periodo_academico_id' => 'required|exists:periodo_academico,id',
                'cupo_maximo' => 'required|integer|min:1',
                'cupo_minimo' => 'nullable|integer|min:1',
            ]);

            $grupo = Grupo::create($validated);
            return response()->json([
                'success' => true,
                'data' => $grupo->load(['materia', 'periodo']),
                'message' => 'Grupo creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
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
            return response()->json([
                'success' => true,
                'data' => $grupo->load(['materia', 'periodo']),
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
                'codigo_grupo' => 'sometimes|string|max:50|unique:grupo,codigo_grupo,' . $grupo->id,
                'materia_id' => 'sometimes|exists:materia,id',
                'periodo_academico_id' => 'sometimes|exists:periodo_academico,id',
                'cupo_maximo' => 'sometimes|integer|min:1',
                'cupo_minimo' => 'nullable|integer|min:1',
            ]);

            $grupo->update($validated);
            return response()->json([
                'success' => true,
                'data' => $grupo,
                'message' => 'Grupo actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
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
            $grupo->delete();
            return response()->json([
                'success' => true,
                'message' => 'Grupo eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}