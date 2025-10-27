<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PeriodoAcademico;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodoController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $periodos = PeriodoAcademico::orderBy('fecha_inicio', 'desc')->paginate(15);
            return response()->json([
                'success' => true,
                'data' => $periodos,
                'message' => 'Períodos académicos obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener períodos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after:fecha_inicio',
                'activo' => 'boolean',
            ]);

            $periodo = PeriodoAcademico::create($validated);
            return response()->json([
                'success' => true,
                'data' => $periodo,
                'message' => 'Período académico creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear período',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(PeriodoAcademico $periodo): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $periodo,
                'message' => 'Período académico obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener período',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, PeriodoAcademico $periodo): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'sometimes|string|max:255',
                'fecha_inicio' => 'sometimes|date',
                'fecha_fin' => 'sometimes|date|after:fecha_inicio',
                'activo' => 'boolean',
            ]);

            $periodo->update($validated);
            return response()->json([
                'success' => true,
                'data' => $periodo,
                'message' => 'Período académico actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar período',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(PeriodoAcademico $periodo): JsonResponse
    {
        try {
            if ($periodo->grupos()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el período porque tiene grupos asignados'
                ], 409);
            }

            $periodo->delete();
            return response()->json([
                'success' => true,
                'message' => 'Período académico eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar período',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}