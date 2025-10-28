<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HorarioAsignado;
use App\Models\ModalidadClase;
use App\Services\HorarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HorarioController extends Controller
{
    private HorarioService $horarioService;

    public function __construct(HorarioService $horarioService)
    {
        $this->horarioService = $horarioService;
    }

    /**
     * CU11 - Visualizar Horario
     */
    public function index(): JsonResponse
    {
        try {
            $horarios = HorarioAsignado::with([
                'grupo.materia',
                'docente.persona',
                'aula',
                'bloqueHorario',
                'periodo',
                'modalidad'
            ])->paginate(15);

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

    /**
     * CU11 - Visualizar Horario (filtrado)
     */
    public function show(HorarioAsignado $horarioAsignado): JsonResponse
    {
        try {
            $horarioAsignado->load([
                'grupo.materia',
                'docente.persona',
                'aula',
                'bloqueHorario',
                'periodo',
                'modalidad'
            ]);

            return response()->json([
                'success' => true,
                'data' => $horarioAsignado,
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
     * CU12 - Modificar Horario Manualmente
     */
    public function update(Request $request, HorarioAsignado $horarioAsignado): JsonResponse
    {
        try {
            $validated = $request->validate([
                'docente_id' => 'sometimes|exists:docente,persona_id',
                'aula_id' => 'sometimes|exists:aula,id',
                'bloque_horario_id' => 'sometimes|exists:bloque_horario,id',
                'modalidad_id' => 'sometimes|exists:modalidad_clase,id',
            ]);

            // Validar conflictos ANTES de actualizar
            $docenteId = $validated['docente_id'] ?? $horarioAsignado->docente_id;
            $aulaId = $validated['aula_id'] ?? $horarioAsignado->aula_id;
            $bloqueId = $validated['bloque_horario_id'] ?? $horarioAsignado->bloque_horario_id;

            $validacion = $this->horarioService->validarAsignacion(
                $horarioAsignado->grupo_id,
                $aulaId,
                $bloqueId,
                $horarioAsignado->periodo_academico_id,
                $docenteId
            );

            if (!$validacion['valido']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conflicto detectado',
                    'conflictos' => $validacion['conflictos']
                ], 409);
            }

            DB::beginTransaction();

            $horarioAsignado->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $horarioAsignado->fresh()->load([
                    'grupo.materia',
                    'docente.persona',
                    'aula',
                    'bloqueHorario',
                    'modalidad'
                ]),
                'message' => 'Horario actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU12 - Eliminar Horario
     */
    public function destroy(HorarioAsignado $horarioAsignado): JsonResponse
    {
        try {
            DB::beginTransaction();
            $horarioAsignado->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Horario eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU10 - Generar Horario Automáticamente
     */
    public function generar(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'periodo_id' => 'required|exists:periodo_academico,id',
            ], [
                'periodo_id.required' => 'El ID del período es requerido',
                'periodo_id.exists' => 'El período no existe',
            ]);

            DB::beginTransaction();

            // Usar el servicio para generar horarios
            $resultado = $this->horarioService->generarHorario($validated['periodo_id']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $resultado,
                'message' => 'Horarios generados exitosamente'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al generar horarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Visualizar horarios por docente
     */
    public function porDocente(int $docenteId): JsonResponse
    {
        try {
            $horarios = HorarioAsignado::where('docente_id', $docenteId)
                ->with([
                    'grupo.materia',
                    'aula',
                    'bloqueHorario',
                    'periodo',
                    'modalidad'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $horarios,
                'message' => 'Horarios del docente obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios del docente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Visualizar horarios por aula
     */
    public function porAula(int $aulaId): JsonResponse
    {
        try {
            $horarios = HorarioAsignado::where('aula_id', $aulaId)
                ->with([
                    'grupo.materia',
                    'docente.persona',
                    'bloqueHorario',
                    'periodo',
                    'modalidad'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $horarios,
                'message' => 'Horarios del aula obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios del aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Visualizar horarios por grupo
     */
    public function porGrupo(int $grupoId): JsonResponse
    {
        try {
            $horarios = HorarioAsignado::where('grupo_id', $grupoId)
                ->with([
                    'materia',
                    'docente.persona',
                    'aula',
                    'bloqueHorario',
                    'periodo',
                    'modalidad'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $horarios,
                'message' => 'Horarios del grupo obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios del grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}