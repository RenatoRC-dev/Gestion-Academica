<?php

namespace App\Http\Controllers\Api\GestionHorarios;

use App\Http\Controllers\Controller;
use App\Models\Docente;
use App\Models\HorarioAsignado;
use App\Models\ModalidadClase;
use App\Services\GestionHorarios\HorarioService;
use App\Exceptions\HorarioGeneracionException;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
    public function index(Request $request): JsonResponse
    {
        try {
            $search = trim((string)$request->query('search', ''));
            $docenteId = $request->query('docente_id');
            $grupoId = $request->query('grupo_id');
            $materiaId = $request->query('materia_id');
            $pattern = strtoupper(trim((string)$request->query('pattern', '')));
            $periodoId = $request->query('periodo_id');

            $query = HorarioAsignado::with([
                'grupo.materia',
                'docente.persona',
                'aula',
                'bloqueHorario.dia',
                'bloqueHorario.horario',
                'periodo',
                'modalidad'
            ]);

            if ($search !== '') {
                $like = '%' . Str::lower($search) . '%';
                $query->where(function ($builder) use ($like) {
                    $builder
                        ->whereHas('docente.persona', fn($q) => $q->whereRaw('LOWER(nombre_completo) LIKE ?', [$like]))
                        ->orWhereHas('grupo', fn($q) => $q->whereRaw('LOWER(codigo_grupo) LIKE ?', [$like]))
                        ->orWhereHas('grupo.materia', fn($q) => $q->whereRaw('LOWER(nombre) LIKE ?', [$like]))
                        ->orWhereHas('aula', fn($q) => $q->whereRaw('LOWER(codigo_aula) LIKE ?', [$like]));
                });
            }

            if ($docenteId) {
                $query->where('docente_id', $docenteId);
            }

            if ($grupoId) {
                $query->where('grupo_id', $grupoId);
            }

            if ($materiaId) {
                $query->whereHas('grupo.materia', fn($q) => $q->where('id', $materiaId));
            }

            if ($periodoId) {
                $query->where('periodo_academico_id', $periodoId);
            }

            $this->aplicarFiltroActivo($query, $request);

            if (in_array($pattern, ['LMV', 'MJ'], true)) {
                $dias = $pattern === 'LMV' ? [1, 3, 5] : [2, 4];
                $query->whereHas('bloqueHorario', fn($q) => $q->whereIn('dia_id', $dias));
            }

            $horarios = $query->paginate(15);

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

    public function calendario(HorarioAsignado $horarioAsignado): JsonResponse
    {
        try {
            $calendario = $this->generarCalendario($horarioAsignado);
            return response()->json([
                'success' => true,
                'data' => $calendario,
                'message' => 'Calendario del horario obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener calendario del horario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function calendarioDocente(): JsonResponse
    {
        try {
            $usuario = auth()->user();
            $tieneRolDocente = $usuario->roles()->where('nombre', 'docente')->exists();
            if (!$tieneRolDocente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo los docentes pueden ver su calendario'
                ], 403);
            }

            $personaId = $usuario->persona?->id ?? null;
            if (!$personaId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el perfil académico'
                ], 404);
            }

            $docente = Docente::where('persona_id', $personaId)->first();
            if (!$docente) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró perfil de docente asociado'
                ], 404);
            }

            $hasta = Carbon::now()->addWeeks(2);
            $horarios = HorarioAsignado::where('docente_id', $docente->persona_id)
                ->with(['bloqueHorario.dia', 'bloqueHorario.horario', 'periodo', 'asistencias.estado'])
                ->get();

            $agenda = [];
            foreach ($horarios as $horario) {
                $items = $this->generarCalendario($horario, Carbon::now(), $hasta);
                foreach ($items as $item) {
                    $agenda[] = array_merge($item, ['horario_id' => $horario->id, 'grupo' => $horario->grupo_id]);
                }
            }

            usort($agenda, fn($a, $b) => $a['fecha'] <=> $b['fecha']);

            return response()->json([
                'success' => true,
                'data' => $agenda,
                'message' => 'Calendario docente obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener calendario docente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function virtualesDocente(): JsonResponse
    {
        try {
            $usuario = auth()->user();
            $usuario->loadMissing('persona');
            $persona = $usuario->persona;
            if (!$persona) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el perfil académico del docente'
                ], 404);
            }

            $docente = Docente::where('persona_id', $persona->id)->first();
            if (!$docente) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró perfil de docente asociado'
                ], 404);
            }

            $horarios = HorarioAsignado::where('docente_id', $docente->persona_id)
                ->where('modalidad_id', 2)
                ->where('virtual_autorizado', true)
                ->with([
                    'grupo.materia',
                    'bloqueHorario.dia',
                    'bloqueHorario.horario',
                    'periodo',
                ])
                ->orderBy('bloque_horario_id')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $horarios,
                'message' => 'Horarios virtuales obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios virtuales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function generarCalendario(HorarioAsignado $horarioAsignado, ?CarbonInterface $desde = null, ?CarbonInterface $hasta = null): array
    {
        $horarioAsignado->loadMissing(['bloqueHorario.dia', 'bloqueHorario.horario', 'periodo', 'asistencias.estado']);

        $bloque = $horarioAsignado->bloqueHorario;
        $periodo = $horarioAsignado->periodo;

        if (!$bloque || !$bloque->horario || !$periodo || !$periodo->fecha_inicio || !$periodo->fecha_fin) {
            return [];
        }

        $inicio = Carbon::instance($periodo->fecha_inicio)->startOfDay();
        $fin = Carbon::instance($periodo->fecha_fin)->endOfDay();
        $diaEsperado = (int) $bloque->dia_id;

        $desde = $desde ? $desde->copy()->startOfDay()->max($inicio) : $inicio;
        $hasta = $hasta ? $hasta->copy()->endOfDay()->min($fin) : $fin;

        $asistencias = $horarioAsignado->asistencias->groupBy(function ($a) {
            return $a->fecha_hora_registro->toDateString();
        });

        $agenda = [];
        $cursor = $desde->copy();
        while ($cursor->lessThanOrEqualTo($hasta)) {
            if ($cursor->dayOfWeekIso === $diaEsperado) {
                $fechaClave = $cursor->toDateString();
                $asistencia = $asistencias->get($fechaClave)?->first() ?? null;
                $agenda[] = [
                    'fecha' => $fechaClave,
                    'dia' => $bloque->dia->nombre ?? 'Día',
                    'hora_inicio' => (string) $bloque->horario->hora_inicio,
                    'hora_fin' => (string) $bloque->horario->hora_fin,
                    'asistencia_registrada' => (bool) $asistencia,
                    'estado' => $asistencia?->estado->nombre ?? null,
                ];
            }
            $cursor->addDay();
        }

        return $agenda;
    }

    /**
     * CU12 - Modificar Horario Manualmente
     * CORRECCIÓN CRÍTICA: Validación de conflictos reparada
     */
    public function update(Request $request, HorarioAsignado $horarioAsignado): JsonResponse
    {
        try {
            $usuario = auth()->user();
            $roles = $usuario->roles()->pluck('nombre')->map(fn ($nombre) => strtolower($nombre))->toArray();
            $esAdmin = in_array('administrador_academico', $roles, true);
            $esAutoridad = in_array('autoridad_academica', $roles, true);

            if (!$esAdmin && !$esAutoridad) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para modificar horarios'
                ], 403);
            }

            if ($esAdmin) {
                $validated = $request->validate([
                    'docente_id' => 'sometimes|exists:docente,persona_id',
                    'aula_id' => 'sometimes|exists:aula,id',
                    'bloque_horario_id' => 'sometimes|exists:bloque_horario,id',
                    'modalidad_id' => 'sometimes|exists:modalidad_clase,id',
                    'virtual_autorizado' => 'sometimes|boolean',
                    'activo' => 'sometimes|boolean',
                ]);
            } else {
                $validated = $request->validate([
                    'virtual_autorizado' => 'required|boolean',
                ]);
            }

            $docenteId = $validated['docente_id'] ?? $horarioAsignado->docente_id;
            $aulaId = $validated['aula_id'] ?? $horarioAsignado->aula_id;
            $bloqueId = $validated['bloque_horario_id'] ?? $horarioAsignado->bloque_horario_id;

            if ($esAdmin) {
                $validacion = $this->horarioService->validarAsignacion(
                    $horarioAsignado->grupo_id,
                    $aulaId,
                    $bloqueId,
                    $horarioAsignado->periodo_academico_id,
                    $docenteId,
                    $horarioAsignado->id
                );

                if (!$validacion['valido']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Conflicto detectado',
                        'conflictos' => $validacion['conflictos']
                    ], 409);
                }
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
            // Solo administrador puede eliminar horarios
            $usuario = auth()->user();
            if (!$usuario->roles()->where('nombre', 'administrador_academico')->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para eliminar horarios'
                ], 403);
            }

            DB::beginTransaction();
            $horarioAsignado->asistencias()->delete();
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
            // Solo administrador puede generar horarios
            $usuario = auth()->user();
            if (!$usuario->roles()->where('nombre', 'administrador_academico')->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para generar horarios'
                ], 403);
            }

            $validated = $request->validate([
                'periodo_id' => 'required|exists:periodo_academico,id',
                'restricciones_docentes' => 'nullable|array',
                'restricciones_docentes.*.docente_id' => 'nullable|exists:docente,persona_id',
                'restricciones_docentes.*.pisos' => 'nullable|array',
                'restricciones_docentes.*.pisos.*' => 'integer|min:0',
                'preferencias' => 'nullable|array',
                'preferencias.*.docente_id' => 'required_with:preferencias|exists:docente,persona_id',
                'preferencias.*.grupo_id' => 'required_with:preferencias|exists:grupo,id',
                'preferencias.*.pattern' => 'required_with:preferencias|string|in:LMV,MJ',
            ], [
                'periodo_id.required' => 'El ID del período es requerido',
                'periodo_id.exists' => 'El período no existe',
            ]);

            DB::beginTransaction();

            $restricciones = [];
            if (!empty($validated['restricciones_docentes'])) {
                foreach ($validated['restricciones_docentes'] as $entry) {
                    $docenteId = $entry['docente_id'] ?? null;
                    $pisosRaw = $entry['pisos'] ?? [];
                    $pisos = array_values(array_filter(array_map('intval', $pisosRaw), fn($p) => $p >= 0));
                    if (!$docenteId || empty($pisos)) {
                        continue;
                    }
                    $restricciones[$docenteId] = $pisos;
                }
            }

            if (!empty($restricciones)) {
                $this->horarioService->setRestriccionesDocentes($restricciones);
            }

            if (!empty($validated['preferencias'])) {
                $this->horarioService->setPreferencias($validated['preferencias']);
            }

            // ✅ CORRECCIÓN CRÍTICA: NO desactivar todos los horarios del período
            // El sistema ahora genera horarios solo para grupos sin asignación,
            // respetando los bloques ya ocupados por otros grupos del mismo período.
            // Si se necesita regenerar todo, el usuario debe eliminar manualmente los horarios existentes.
            // $this->archivarHorariosPeriodo($validated['periodo_id']);

            // Usar el servicio para generar horarios
            $resultado = $this->horarioService->generarHorario($validated['periodo_id']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $resultado,
                'message' => 'Horarios generados exitosamente'
            ], 200);

        } catch (HorarioGeneracionException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'conflictos' => $e->getConflictos()
            ], 422);
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
    public function porDocente(Request $request, int $docenteId): JsonResponse
    {
        try {
            $consulta = HorarioAsignado::where('docente_id', $docenteId)
                ->with([
                    'grupo.materia',
                    'aula',
                    'bloqueHorario',
                    'periodo',
                    'modalidad'
                ]);
            $this->aplicarFiltroActivo($consulta, $request);
            $horarios = $consulta->get();

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
    public function porAula(Request $request, int $aulaId): JsonResponse
    {
        try {
            $consulta = HorarioAsignado::where('aula_id', $aulaId)
                ->with([
                    'grupo.materia',
                    'docente.persona',
                    'bloqueHorario',
                    'periodo',
                    'modalidad'
                ]);
            $this->aplicarFiltroActivo($consulta, $request);
            $horarios = $consulta->get();

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

    private function archivarHorariosPeriodo(int $periodoId): void
    {
        HorarioAsignado::where('periodo_academico_id', $periodoId)
            ->where('activo', true)
            ->update(['activo' => false]);
    }

    private function aplicarFiltroActivo($consulta, Request $request): void
    {
        $activoParam = $request->query('activo');
        if ($activoParam === null) {
            $consulta->where('activo', true);
            return;
        }

        $activo = filter_var($activoParam, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if (!is_null($activo)) {
            $consulta->where('activo', $activo);
        }
    }

    /**
     * Visualizar horarios por grupo
     */
    public function porGrupo(Request $request, int $grupoId): JsonResponse
    {
        try {
            $consulta = HorarioAsignado::where('grupo_id', $grupoId)
                ->with([
                    'grupo.materia',
                    'docente.persona',
                    'aula',
                    'bloqueHorario',
                    'periodo',
                    'modalidad'
                ]);
            $this->aplicarFiltroActivo($consulta, $request);
            $horarios = $consulta->get();

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

    /**
     * CU11 - Visualizar horarios por período académico
     * NUEVO: Filtrado por período
     */
    public function porPeriodo(Request $request, int $periodoId): JsonResponse
    {
        try {
            $consulta = HorarioAsignado::where('periodo_academico_id', $periodoId)
                ->with([
                    'grupo.materia',
                    'docente.persona',
                    'aula',
                    'bloqueHorario',
                    'periodo',
                    'modalidad'
                ]);
            $this->aplicarFiltroActivo($consulta, $request);
            $horarios = $consulta->get();

            return response()->json([
                'success' => true,
                'data' => $horarios,
                'message' => 'Horarios del período obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios del período',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
