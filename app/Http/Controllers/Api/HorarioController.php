<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Horario;
use App\Models\HorarioAsignado;
use App\Models\Grupo;
use App\Models\Docente;
use App\Models\Aula;
use App\Models\BloqueHorario;
use App\Models\PeriodoAcademico;
use App\Models\ModalidadClase;
use App\Services\HorarioService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class HorarioController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $horarios = Horario::with('periodo')->paginate(15);
            return response()->json([
                'success' => true,
                'data' => $horarios,
                'message' => 'Horarios obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Horario $horario): JsonResponse
    {
        try {
            $asignaciones = HorarioAsignado::where('periodo_academico_id', $horario->periodo_academico_id)
                ->with(['docente.persona.usuario', 'grupo.materia', 'aula', 'bloqueHorario', 'modalidad'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'horario' => $horario,
                    'asignaciones' => $asignaciones,
                    'total' => $asignaciones->count()
                ],
                'message' => 'Horario obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar horario automáticamente con heurística inteligente
     */
    public function generar(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'periodo_academico_id' => 'required|exists:periodo_academico,id',
            ]);

            $horarioService = new HorarioService();
            $resultado = $horarioService->generarHorario($validated['periodo_academico_id']);

            return response()->json([
                'success' => true,
                'data' => $resultado,
                'message' => 'Horario generado automáticamente con heurística'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener horario por docente
     */
    public function horarioDocente(Request $request): JsonResponse
    {
        try {
            $docenteId = $request->get('docente_id');

            if (!$docenteId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debe proporcionar docente_id'
                ], 400);
            }

            // docente_id es en realidad persona_id
            $asignaciones = HorarioAsignado::where('docente_id', $docenteId)
                ->with(['grupo.materia', 'aula', 'bloqueHorario', 'modalidad'])
                ->orderBy('bloque_horario_id')
                ->get()
                ->groupBy(function ($item) {
                    return $item->bloqueHorario->hora_inicio;
                });

            return response()->json([
                'success' => true,
                'data' => $asignaciones,
                'message' => 'Horario del docente obtenido'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar estado de horario
     */
    public function actualizarEstado(Horario $horario, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'estado' => 'required|string'
            ]);

            $horario->update(['estado' => $validated['estado']]);

            return response()->json([
                'success' => true,
                'data' => $horario,
                'message' => 'Estado del horario actualizado'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar asignación de horario manualmente (CU12)
     */
    public function update(Request $request, HorarioAsignado $horarioAsignado): JsonResponse
    {
        try {
            $validated = $request->validate([
                'aula_id' => 'nullable|exists:aula,id',
                'bloque_horario_id' => 'nullable|exists:bloque_horario,id',
                'docente_id' => 'nullable|exists:docente,persona_id',
                'modalidad_id' => 'nullable|exists:modalidad_clase,id'
            ]);

            $aulaId = $validated['aula_id'] ?? $horarioAsignado->aula_id;
            $bloqueId = $validated['bloque_horario_id'] ?? $horarioAsignado->bloque_horario_id;
            $docenteId = $validated['docente_id'] ?? $horarioAsignado->docente_id;
            $modalidadId = $validated['modalidad_id'] ?? $horarioAsignado->modalidad_id;

            // Validar conflictos
            $horarioService = new HorarioService();
            $validacion = $horarioService->validarAsignacion(
                $horarioAsignado->grupo_id,
                $aulaId,
                $bloqueId,
                $horarioAsignado->periodo_academico_id,
                $docenteId
            );

            if (!$validacion['valido']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede realizar esta asignación debido a conflictos',
                    'conflictos' => $validacion['conflictos']
                ], 409);
            }

            // Actualizar
            $horarioAsignado->update([
                'aula_id' => $aulaId,
                'bloque_horario_id' => $bloqueId,
                'docente_id' => $docenteId,
                'modalidad_id' => $modalidadId
            ]);

            return response()->json([
                'success' => true,
                'data' => $horarioAsignado->load(['grupo.materia', 'docente.persona', 'aula', 'bloqueHorario', 'modalidad']),
                'message' => 'Asignación de horario actualizada exitosamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear asignación de horario manual
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'grupo_id' => 'required|exists:grupo,id',
                'docente_id' => 'required|exists:docente,persona_id',
                'aula_id' => 'required|exists:aula,id',
                'bloque_horario_id' => 'required|exists:bloque_horario,id',
                'periodo_academico_id' => 'required|exists:periodo_academico,id',
                'modalidad_id' => 'nullable|exists:modalidad_clase,id'
            ]);

            // Validar conflictos
            $horarioService = new HorarioService();
            $validacion = $horarioService->validarAsignacion(
                $validated['grupo_id'],
                $validated['aula_id'],
                $validated['bloque_horario_id'],
                $validated['periodo_academico_id'],
                $validated['docente_id']
            );

            if (!$validacion['valido']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede crear esta asignación debido a conflictos',
                    'conflictos' => $validacion['conflictos']
                ], 409);
            }

            $modalidad = ModalidadClase::where('nombre', 'Presencial')->first();

            $asignacion = HorarioAsignado::create([
                'grupo_id' => $validated['grupo_id'],
                'docente_id' => $validated['docente_id'],
                'aula_id' => $validated['aula_id'],
                'bloque_horario_id' => $validated['bloque_horario_id'],
                'periodo_academico_id' => $validated['periodo_academico_id'],
                'modalidad_id' => $validated['modalidad_id'] ?? $modalidad->id
            ]);

            return response()->json([
                'success' => true,
                'data' => $asignacion->load(['grupo.materia', 'docente.persona', 'aula', 'bloqueHorario', 'modalidad']),
                'message' => 'Asignación de horario creada exitosamente'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear asignación',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}