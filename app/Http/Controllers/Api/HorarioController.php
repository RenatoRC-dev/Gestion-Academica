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
     * Generar horario automáticamente - ESTRUCTURA REAL CORREGIDA
     */
    public function generar(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'periodo_academico_id' => 'required|exists:periodo_academico,id',
            ]);

            $periodo = PeriodoAcademico::find($validated['periodo_academico_id']);

            // Obtener datos necesarios
            $grupos = Grupo::where('periodo_academico_id', $periodo->id)
                ->with('materia')
                ->get();

            if ($grupos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay grupos en este período'
                ], 400);
            }

            $docentes = Docente::with('persona')->get();
            $aulas = Aula::where('es_virtual', false)->get();
            
            // CORRECCIÓN: BloqueHorario está vinculado con Dia y Horario
            $bloques = BloqueHorario::with(['dia', 'horario'])->get();
            $modalidadPresencial = ModalidadClase::where('nombre', 'Presencial')->first() ?? ModalidadClase::first();

            if ($docentes->isEmpty() || $aulas->isEmpty() || $bloques->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Faltan datos maestros: docentes, aulas o bloques horarios. Asegúrate de haber creado días, horarios y bloques.'
                ], 400);
            }

            $asignacionesCreadas = 0;

            foreach ($grupos as $grupo) {
                // Seleccionar docente aleatorio
                $docente = $docentes->random();

                // Asignar 3 bloques aleatorios
                $bloquesSeleccionados = $bloques->random(min(3, count($bloques)));
                
                foreach ($bloquesSeleccionados as $bloque) {
                    // Seleccionar aula
                    $aula = $aulas->random();

                    // Crear asignación con ESTRUCTURA CORRECTA
                    HorarioAsignado::create([
                        'grupo_id' => $grupo->id,
                        'docente_id' => $docente->persona_id,  // persona_id
                        'aula_id' => $aula->id,
                        'bloque_horario_id' => $bloque->id,
                        'periodo_academico_id' => $periodo->id,
                        'modalidad_id' => $modalidadPresencial->id,
                        'fecha_especifica' => null,
                    ]);

                    $asignacionesCreadas++;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo_id' => $periodo->id,
                    'total_asignaciones_creadas' => $asignacionesCreadas,
                    'grupos_procesados' => $grupos->count(),
                ],
                'message' => 'Horario generado automáticamente'
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

    public function destroy(Horario $horario): JsonResponse
    {
        try {
            HorarioAsignado::where('periodo_academico_id', $horario->periodo_academico_id)->delete();
            $horario->delete();

            return response()->json([
                'success' => true,
                'message' => 'Horario eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}