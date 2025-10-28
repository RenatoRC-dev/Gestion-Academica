<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BloqueHorario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BloqueHorarioController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $bloques = BloqueHorario::paginate(15);
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
                'numero_bloque' => 'required|integer|min:1|max:10',
                'dia_semana' => 'required|string|in:Lunes,Martes,Miércoles,Jueves,Viernes,Sábado',
                'hora_inicio' => 'required|date_format:H:i',
                'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
                'activo' => 'nullable|boolean',
            ], [
                'numero_bloque.required' => 'El número de bloque es requerido',
                'dia_semana.required' => 'El día de semana es requerido',
                'hora_inicio.required' => 'La hora de inicio es requerida',
                'hora_fin.required' => 'La hora de fin es requerida',
            ]);

            DB::beginTransaction();

            $bloque = BloqueHorario::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $bloque,
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
                'numero_bloque' => 'sometimes|integer|min:1|max:10',
                'dia_semana' => 'sometimes|string|in:Lunes,Martes,Miércoles,Jueves,Viernes,Sábado',
                'hora_inicio' => 'sometimes|date_format:H:i',
                'hora_fin' => 'sometimes|date_format:H:i',
                'activo' => 'nullable|boolean',
            ]);

            DB::beginTransaction();

            $bloqueHorario->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $bloqueHorario->fresh(),
                'message' => 'Bloque horario actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(BloqueHorario $bloqueHorario): JsonResponse
    {
        try {
            DB::beginTransaction();
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