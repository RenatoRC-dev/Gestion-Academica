<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grupo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GrupoController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $grupos = Grupo::paginate(15);
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
                'codigo' => 'required|string|max:50|unique:grupo,codigo',
                'nombre' => 'nullable|string|max:255',
                'cantidad_maxima' => 'required|integer|min:1|max:100',
            ], [
                'codigo.required' => 'El código es requerido',
                'codigo.unique' => 'Este código ya existe',
                'cantidad_maxima.required' => 'La cantidad máxima es requerida',
            ]);

            DB::beginTransaction();

            $grupo = Grupo::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $grupo,
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
                'codigo' => 'sometimes|string|max:50|unique:grupo,codigo,' . $grupo->id,
                'nombre' => 'nullable|string|max:255',
                'cantidad_maxima' => 'sometimes|integer|min:1|max:100',
            ]);

            DB::beginTransaction();

            $grupo->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $grupo->fresh(),
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