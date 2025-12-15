<?php

namespace App\Http\Controllers\Api\GestionAcademica;

use App\Http\Controllers\Controller;
use App\Models\Aula;
use App\Models\HorarioAsignado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AulaController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $aulas = Aula::paginate(15);
            return response()->json([
                'success' => true,
                'data' => $aulas,
                'message' => 'Aulas obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener aulas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:255|unique:aula,codigo_aula',
                'capacidad' => 'required|integer|min:1|max:200',
                'ubicacion' => 'nullable|string|max:255',
                'piso' => 'nullable|integer',
                'equipamiento' => 'nullable|string',
                'es_virtual' => 'nullable|boolean',
                'activo' => 'nullable|boolean',
            ], [
                'nombre.required' => 'El nombre es requerido',
                'nombre.unique' => 'Este nombre ya existe',
                'capacidad.required' => 'La capacidad es requerida',
            ]);

            DB::beginTransaction();

            $aula = Aula::create([
                'codigo_aula' => $validated['nombre'],
                'capacidad' => $validated['capacidad'],
                'ubicacion' => $validated['ubicacion'] ?? null,
                'piso' => $validated['piso'] ?? null,
                'equipamiento' => $validated['equipamiento'] ?? null,
                'es_virtual' => $validated['es_virtual'] ?? false,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $aula,
                'message' => 'Aula creada exitosamente'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Aula $aula): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $aula,
                'message' => 'Aula obtenida exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Aula $aula): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'sometimes|string|max:255|unique:aula,codigo_aula,' . $aula->id,
                'capacidad' => 'sometimes|integer|min:1|max:200',
                'ubicacion' => 'nullable|string|max:255',
                'equipamiento' => 'nullable|string',
                'es_virtual' => 'nullable|boolean',
                'activo' => 'nullable|boolean',
                'piso' => 'nullable|integer',
            ]);

            DB::beginTransaction();

            $aula->update(array_filter([
                'codigo_aula' => $validated['nombre'] ?? null,
                'capacidad' => $validated['capacidad'] ?? null,
                'ubicacion' => $validated['ubicacion'] ?? null,
                'equipamiento' => $validated['equipamiento'] ?? null,
                'es_virtual' => $validated['es_virtual'] ?? null,
                'activo' => $validated['activo'] ?? null,
                'piso' => $validated['piso'] ?? null,
            ], fn($val) => $val !== null));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $aula->fresh(),
                'message' => 'Aula actualizada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Aula $aula): JsonResponse
    {
        try {
            // ✅ CORRECCIÓN: Validar que NO tenga horarios asignados activos
            if (HorarioAsignado::where('aula_id', $aula->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un aula que tiene horarios asignados'
                ], 422);
            }

            DB::beginTransaction();
            $aula->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Aula eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
