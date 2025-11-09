<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materia;
use App\Models\Grupo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                'codigo' => 'required|string|unique:materia,codigo_materia',
                'nombre' => 'required|string|max:255',
                'descripcion' => 'nullable|string',
                'activo' => 'nullable|boolean',
            ], [
                'codigo.required' => 'El código es requerido',
                'codigo.unique' => 'Este código ya existe',
                'nombre.required' => 'El nombre es requerido',
            ]);

            DB::beginTransaction();

            $materia = Materia::create([
                'codigo_materia' => $validated['codigo'],
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null,
                'activo' => $validated['activo'] ?? true,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $materia,
                'message' => 'Materia creada exitosamente'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
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
                'codigo' => 'sometimes|string|unique:materia,codigo_materia,' . $materia->id,
                'nombre' => 'sometimes|string|max:255',
                'descripcion' => 'nullable|string',
                'activo' => 'nullable|boolean',
            ]);

            DB::beginTransaction();

            $materia->update(array_filter([
                'codigo_materia' => $validated['codigo'] ?? null,
                'nombre' => $validated['nombre'] ?? null,
                'descripcion' => $validated['descripcion'] ?? null,
                'activo' => $validated['activo'] ?? null,
            ], fn($val) => $val !== null));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $materia->fresh(),
                'message' => 'Materia actualizada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
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
            // ✅ CORRECCIÓN: Validar que NO tenga grupos activos
            if (Grupo::where('materia_id', $materia->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar una materia que tiene grupos académicos activos'
                ], 422);
            }

            DB::beginTransaction();
            $materia->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Materia eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar materia',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
