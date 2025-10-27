<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aula;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AulaController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $aulas = Aula::with('tipo')->paginate(15);
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
                'codigo_aula' => 'required|string|max:50|unique:aula,codigo_aula',
                'capacidad' => 'required|integer|min:1',
                'tipo_aula_id' => 'required|exists:tipo_aula,id',
                'ubicacion' => 'required|string|max:500',
                'equipamiento' => 'nullable|string|max:500',
                'es_virtual' => 'boolean',
                'activo' => 'boolean',
            ]);

            $aula = Aula::create($validated);
            return response()->json([
                'success' => true,
                'data' => $aula->load('tipo'),
                'message' => 'Aula creada exitosamente'
            ], 201);
        } catch (\Exception $e) {
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
                'data' => $aula->load('tipo'),
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
                'codigo_aula' => 'sometimes|string|max:50|unique:aula,codigo_aula,' . $aula->id,
                'capacidad' => 'sometimes|integer|min:1',
                'tipo_aula_id' => 'sometimes|exists:tipo_aula,id',
                'ubicacion' => 'sometimes|string|max:500',
                'equipamiento' => 'nullable|string|max:500',
                'es_virtual' => 'boolean',
                'activo' => 'boolean',
            ]);

            $aula->update($validated);
            return response()->json([
                'success' => true,
                'data' => $aula,
                'message' => 'Aula actualizada exitosamente'
            ], 200);
        } catch (\Exception $e) {
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
            if ($aula->horariosAsignados()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el aula porque tiene horarios asignados'
                ], 409);
            }

            $aula->delete();
            return response()->json([
                'success' => true,
                'message' => 'Aula eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}