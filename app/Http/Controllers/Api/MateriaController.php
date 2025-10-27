<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MateriaController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $materias = Materia::paginate(15);
            return response()->json([
                'success' => true,
                'data' => $materias,
                'message' => 'Materias obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener materias',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'codigo_materia' => 'required|string|max:50|unique:materia,codigo_materia',
                'nombre' => 'required|string|max:255',
                'descripcion' => 'nullable|string|max:1000',
                'activo' => 'boolean',
            ]);

            $materia = Materia::create($validated);
            return response()->json([
                'success' => true,
                'data' => $materia,
                'message' => 'Materia creada exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear materia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Materia $materia): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $materia,
                'message' => 'Materia obtenida exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener materia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Materia $materia): JsonResponse
    {
        try {
            $validated = $request->validate([
                'codigo_materia' => 'sometimes|string|max:50|unique:materia,codigo_materia,' . $materia->id,
                'nombre' => 'sometimes|string|max:255',
                'descripcion' => 'nullable|string|max:1000',
                'activo' => 'boolean',
            ]);

            $materia->update($validated);
            return response()->json([
                'success' => true,
                'data' => $materia,
                'message' => 'Materia actualizada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar materia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Materia $materia): JsonResponse
    {
        try {
            if ($materia->grupos()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la materia porque tiene grupos asignados'
                ], 409);
            }

            $materia->delete();
            return response()->json([
                'success' => true,
                'message' => 'Materia eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar materia',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}