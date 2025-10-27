<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BloqueHorario;
use App\Models\Horario;
use App\Models\Dia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BloqueHorarioController extends Controller
{
    /**
     * Listar todos los bloques horarios
     */
    public function index(): JsonResponse
    {
        try {
            $bloques = BloqueHorario::with(['dia', 'horario'])
                ->orderBy('dia_id')
                ->orderBy('horario_id')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $bloques,
                'message' => 'Bloques horarios obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bloques horarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo bloque horario con validación de solapamientos
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'dia_id' => 'required|exists:dia,id',
                'hora_inicio' => 'required|date_format:H:i',
                'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
                'descripcion' => 'nullable|string|max:50'
            ]);

            // Validar horas coherentes
            if ($validated['hora_inicio'] >= $validated['hora_fin']) {
                return response()->json([
                    'success' => false,
                    'message' => 'La hora de fin debe ser posterior a la hora de inicio'
                ], 422);
            }

            // Validar que no exista horario idéntico
            $horarioExistente = Horario::where('hora_inicio', $validated['hora_inicio'])
                ->where('hora_fin', $validated['hora_fin'])
                ->first();

            $horario = $horarioExistente ?? Horario::create([
                'hora_inicio' => $validated['hora_inicio'],
                'hora_fin' => $validated['hora_fin'],
                'descripcion' => $validated['descripcion'] ?? null
            ]);

            // Validar solapamiento para el día
            $solapamiento = BloqueHorario::where('dia_id', $validated['dia_id'])
                ->whereHas('horario', function ($query) use ($validated) {
                    $query->where(function ($q) use ($validated) {
                        $q->where(function ($inner) use ($validated) {
                            $inner->where('hora_inicio', '<', $validated['hora_fin'])
                                  ->where('hora_fin', '>', $validated['hora_inicio']);
                        });
                    });
                })
                ->first();

            if ($solapamiento) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un bloque horario que se solapa con este horario para el mismo día'
                ], 422);
            }

            // Crear bloque horario
            $bloque = BloqueHorario::create([
                'dia_id' => $validated['dia_id'],
                'horario_id' => $horario->id,
                'activo' => true
            ]);

            return response()->json([
                'success' => true,
                'data' => $bloque->load(['dia', 'horario']),
                'message' => 'Bloque horario creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un bloque horario específico
     */
    public function show(BloqueHorario $bloque): JsonResponse
    {
        try {
            $bloque->load(['dia', 'horario']);

            return response()->json([
                'success' => true,
                'data' => $bloque,
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

    /**
     * Actualizar bloque horario
     */
    public function update(Request $request, BloqueHorario $bloque): JsonResponse
    {
        try {
            $validated = $request->validate([
                'dia_id' => 'nullable|exists:dia,id',
                'hora_inicio' => 'nullable|date_format:H:i',
                'hora_fin' => 'nullable|date_format:H:i',
                'activo' => 'nullable|boolean'
            ]);

            $diaId = $validated['dia_id'] ?? $bloque->dia_id;

            if (isset($validated['hora_inicio']) || isset($validated['hora_fin'])) {
                $horaInicio = $validated['hora_inicio'] ?? $bloque->horario->hora_inicio;
                $horaFin = $validated['hora_fin'] ?? $bloque->horario->hora_fin;

                if ($horaInicio >= $horaFin) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La hora de fin debe ser posterior a la hora de inicio'
                    ], 422);
                }

                // Validar solapamiento (excluir bloque actual)
                $solapamiento = BloqueHorario::where('dia_id', $diaId)
                    ->where('id', '!=', $bloque->id)
                    ->whereHas('horario', function ($query) use ($horaInicio, $horaFin) {
                        $query->where('hora_inicio', '<', $horaFin)
                              ->where('hora_fin', '>', $horaInicio);
                    })
                    ->first();

                if ($solapamiento) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe un bloque horario que se solapa con este horario'
                    ], 422);
                }

                // Actualizar o crear nuevo horario
                $horarioExistente = Horario::where('hora_inicio', $horaInicio)
                    ->where('hora_fin', $horaFin)
                    ->first();

                if ($horarioExistente) {
                    $bloque->horario_id = $horarioExistente->id;
                } else {
                    $nuevoHorario = Horario::create([
                        'hora_inicio' => $horaInicio,
                        'hora_fin' => $horaFin
                    ]);
                    $bloque->horario_id = $nuevoHorario->id;
                }
            }

            $bloque->dia_id = $diaId;
            $bloque->activo = $validated['activo'] ?? $bloque->activo;
            $bloque->save();

            return response()->json([
                'success' => true,
                'data' => $bloque->load(['dia', 'horario']),
                'message' => 'Bloque horario actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar bloque horario (validar que no esté en uso)
     */
    public function destroy(BloqueHorario $bloque): JsonResponse
    {
        try {
            // Verificar si está en uso
            $horariosAsignados = \App\Models\HorarioAsignado::where('bloque_horario_id', $bloque->id)
                ->count();

            if ($horariosAsignados > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar este bloque horario porque está siendo utilizado en asignaciones activas'
                ], 409);
            }

            $bloque->delete();

            return response()->json([
                'success' => true,
                'message' => 'Bloque horario eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar bloque horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener bloques libres para un día específico
     */
    public function bloquesPorDia(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'dia_id' => 'required|exists:dia,id'
            ]);

            $bloques = BloqueHorario::where('dia_id', $validated['dia_id'])
                ->where('activo', true)
                ->with('horario')
                ->orderBy('horario_id')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $bloques,
                'message' => 'Bloques obtenidos por día'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bloques por día',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}