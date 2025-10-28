<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PeriodoAcademico;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PeriodoController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $periodos = PeriodoAcademico::paginate(15);
            return response()->json([
                'success' => true,
                'data' => $periodos,
                'message' => 'Períodos obtenidos exitosamente'
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
                'nombre' => 'required|string|max:100|unique:periodo_academico,nombre',
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after:fecha_inicio',
                'activo' => 'nullable|boolean',
            ], [
                'nombre.required' => 'El nombre es requerido',
                'nombre.unique' => 'Este nombre de período ya existe',
                'fecha_inicio.required' => 'La fecha de inicio es requerida',
                'fecha_fin.required' => 'La fecha de fin es requerida',
                'fecha_fin.after' => 'La fecha de fin debe ser posterior a la fecha de inicio',
            ]);

            DB::beginTransaction();

            $periodo = PeriodoAcademico::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $periodo,
                'message' => 'Período creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
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
                'message' => 'Período obtenido exitosamente'
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
                'nombre' => 'sometimes|string|max:100|unique:periodo_academico,nombre,' . $periodo->id,
                'fecha_inicio' => 'sometimes|date',
                'fecha_fin' => 'sometimes|date|after:fecha_inicio',
                'activo' => 'nullable|boolean',
            ]);

            DB::beginTransaction();

            $periodo->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $periodo->fresh(),
                'message' => 'Período actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
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
            DB::beginTransaction();
            $periodo->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Período eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar período',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}