<?php

namespace App\Services;

use App\Models\Grupo;
use App\Models\BloqueHorario;
use App\Models\Aula;
use App\Models\HorarioAsignado;
use App\Exceptions\HorarioGeneracionException;
use App\Models\Docente;
use App\Models\ModalidadClase;
use App\Models\PeriodoAcademico;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class HorarioService
{
    private float $DELTA = 0.15;          // Porcentaje de capacidad tolerado
    private float $LAMBDA = 2.0;          // Penalidad por asiento vacío
    private int $PENAL_PISO = 10;         // Penalidad por piso alto
    private int $PISO_ALTO = 5;           // A partir de qué piso penalizar
    private bool $tiene_ascensor = true;  // Configuración

    private array $tiposAulaPermitidos = [
        'Aula Teoría',
        'Laboratorio',
        'Taller',
        'Auditorio'
    ];

    private array $modalidadesClase = [
        'Presencial' => 'Clase presencial',
        'Virtual' => 'Clase virtual',
    ];

    private array $metodosAsistencia = [
        'QR' => 'Código QR',
        'Manual' => 'Registro manual',
        'Confirmación Virtual' => 'Confirmación virtual'
    ];

    private array $asignacion = [];
    private array $ocupacion = [];
    private array $restriccionesDocentes = [];
    private array $preferencias = [];
    private array $patterns = [
        'LMV' => [1, 3, 5],
        'MJ' => [2, 4],
    ];

    public function __construct(float $delta = 0.15, float $lambda = 2.0, int $piso = 5)
    {
        $this->DELTA = $delta;
        $this->LAMBDA = $lambda;
        $this->PISO_ALTO = $piso;
    }

    public function setRestriccionesDocentes(array $restricciones): void
    {
        $this->restriccionesDocentes = [];
        foreach ($restricciones as $docenteId => $pisos) {
            $this->restriccionesDocentes[(int)$docenteId] = array_filter(array_map('intval', $pisos), fn ($val) => $val >= 0);
        }
    }

    public function setPreferencias(array $preferencias): void
    {
        $this->preferencias = [];
        foreach ($preferencias as $preferencia) {
            $docente = $preferencia['docente_id'] ?? null;
            $grupo = $preferencia['grupo_id'] ?? null;
            $pattern = strtoupper(trim($preferencia['pattern'] ?? 'LMV'));
            if (!in_array($pattern, ['LMV', 'MJ'], true)) {
                $pattern = 'LMV';
            }
            if (!$docente || !$grupo) {
                continue;
            }
            $this->preferencias[] = [
                'docente_id' => (int)$docente,
                'grupo_id' => (int)$grupo,
                'pattern' => $pattern,
            ];
        }
    }

    private function calcularPenalidad(array $grupo, array $aula): float
    {
        $vacios = $aula['capacidad'] - $grupo['tamano'];
        $delta = $this->DELTA * $aula['capacidad'];
        
        $penVacios = $this->LAMBDA * max(0, $vacios - $delta);
        
        $penPiso = 0;
        if (!$this->tiene_ascensor && $aula['piso'] >= $this->PISO_ALTO) {
            $penPiso = $this->PENAL_PISO;
        }
        
        return $penVacios + $penPiso;
    }

    private function validarTipoAula(string $tipoAula, string $tipoGrupo): bool
    {
        return true;
    }

    /**
     * ✅ CORRECCIÓN CU10: Verificar horarios existentes y validar conflictos en tiempo real
     */
    public function generarHorario(int $periodoId): array
    {
        $periodo = PeriodoAcademico::find($periodoId);
        if (!$periodo) {
            throw new \Exception("Periodo académico no encontrado");
        }

        $asignacionesExistentes = HorarioAsignado::where('periodo_academico_id', $periodoId)
            ->where('activo', true)
            ->get();
        $preferenciasPorGrupo = collect($this->preferencias)
            ->keyBy('grupo_id')
            ->map(fn($pref) => $pref['docente_id'] ?? null)
            ->filter()
            ->toArray();
        $gruposPreferidos = collect($this->preferencias)
            ->pluck('grupo_id')
            ->map(fn ($id) => (int)$id)
            ->filter()
            ->values()
            ->all();

        $reassignIds = [];
        $asignacionesExistentes = $asignacionesExistentes->reject(function ($asignacion) use ($preferenciasPorGrupo, &$reassignIds) {
            $prefDocente = $preferenciasPorGrupo[$asignacion->grupo_id] ?? null;
            if ($prefDocente && $prefDocente !== $asignacion->docente_id) {
                $reassignIds[] = $asignacion->id;
                return true;
            }
            return false;
        });

        if (!empty($reassignIds)) {
            HorarioAsignado::whereIn('id', $reassignIds)->delete();
        }

        $gruposAsignados = $asignacionesExistentes->pluck('grupo_id')->map(fn($id) => (int)$id)->unique()->all();

        $grupos = Grupo::where('periodo_academico_id', $periodoId)
            ->with('materia')
            ->get()
            ->map(function ($g) {
                return [
                    'id' => $g->id,
                    'codigo' => $g->codigo_grupo,
                    'tamano' => $g->cupo_maximo ?? 30,
                    'tipo' => $g->materia->codigo_materia ?? 'GENERAL',
                    'vetos_bloques' => [],
                    'vetos_aulas' => []
                ];
            })
            ->filter(fn($g) => !in_array($g['id'], $gruposAsignados, true) || in_array($g['id'], $gruposPreferidos, true))
            ->values()
            ->toArray();

        $aulas = Aula::where('es_virtual', false)
            ->where('activo', true)
            ->with('tipoAula')
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'codigo' => $a->codigo_aula,
                    'capacidad' => $a->capacidad,
                    'tipo' => $a->tipoAula->nombre ?? 'Aula Teoría',
                    'piso' => $a->piso ?? 1,
                    'ubicacion' => $a->ubicacion,
                    'tiene_equipamiento' => !empty($a->equipamiento)
                ];
            })
            ->toArray();

        $bloques = BloqueHorario::where('activo', true)
            ->with(['dia', 'horario'])
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'dia_id' => $b->dia_id,
                    'horario_id' => $b->horario_id,
                    'hora_inicio' => $b->horario->hora_inicio,
                    'hora_fin' => $b->horario->hora_fin,
                    'codigo' => $b->dia->nombre . ' ' . $b->horario->hora_inicio
                ];
            })
            ->toArray();

        $bloquesPorHorario = [];
        foreach ($bloques as $bloque) {
            $bloquesPorHorario[$bloque['horario_id']][$bloque['dia_id']] = $bloque;
        }

        $docentes = Docente::with('persona')
            ->get()
            ->map(function ($d) {
                return [
                    'id' => $d->persona_id,
                    'nombre' => $d->persona->nombre_completo
                ];
            })
            ->toArray();

        if (empty($grupos) || empty($aulas) || empty($bloques) || empty($docentes)) {
            throw new \Exception("Datos maestros insuficientes para generar horario. " .
                "Grupos: " . count($grupos) . ", Aulas: " . count($aulas) .
                ", Bloques: " . count($bloques) . ", Docentes: " . count($docentes));
        }

        // ✅ CORRECCIÓN: Inicializar ocupación ANTES de asignar preferencias
        $this->inicializarOcupacion($aulas, $bloques, $asignacionesExistentes);

        $tienePreferencias = !empty($this->preferencias);
        $this->asignarPreferencias($grupos, $aulas, $bloques, $docentes, $periodoId, $bloquesPorHorario);
        if (!$tienePreferencias) {
            $this->ejecutarHeuristica($grupos, $aulas, $bloques, $docentes, $asignacionesExistentes);
        }

        $asignacionesCreadas = 0;
        $modalidad = ModalidadClase::where('nombre', 'Presencial')->first();

        $rechazos = [];
        foreach ($this->asignacion as $grupoId => $asignacion) {
            $aulaId = $asignacion['aula_id'];
            $bloqueIds = $asignacion['bloque_ids'] ?? [];
            if (empty($bloqueIds)) {
                continue;
            }

            $aula = collect($aulas)->firstWhere('id', $aulaId);
            if (!$aula) {
                continue;
            }

            $docentePreferidoId = $asignacion['docente_id'] ?? null;
            $planBloques = [];
            $conflicto = false;
            $razon = null;

            foreach ($bloqueIds as $bloqueIndex => $bloqueId) {
                $docenteIdParaBloque = $docentePreferidoId;

                if (!$docenteIdParaBloque) {
                    $docenteDisponible = $this->encontrarDocenteDisponible(
                        $docentes,
                        $bloqueId,
                        $periodoId,
                        $aula
                    );

                    if (!$docenteDisponible) {
                        $razon = "No hay docente disponible para el bloque {$bloqueId}";
                        Log::debug('No hay docente disponible para bloque', ['grupo' => $grupoId, 'bloque' => $bloqueId]);
                        $conflicto = true;
                        break;
                    }

                    $docenteIdParaBloque = $docenteDisponible['id'];
                }

                $validacion = $this->validarAsignacion(
                    $grupoId,
                    $aulaId,
                    $bloqueId,
                    $periodoId,
                    $docenteIdParaBloque,
                    null
                );

                if ($validacion['valido']) {
                    $planBloques[] = [
                        'bloque_id' => $bloqueId,
                        'docente_id' => $docenteIdParaBloque,
                    ];
                    continue;
                }

                $mensaje = implode(' ', $validacion['conflictos']);
                if (stripos($mensaje, 'docente') !== false) {
                    continue;
                }

                $bloqueAlternativo = $this->buscarBloqueAlternativo(
                    $grupoId,
                    $aula,
                    $periodoId,
                    $bloques,
                    $bloqueId,
                    $docentePreferidoId,
                    $docentes
                );
                if ($bloqueAlternativo) {
                    $planBloques[] = $bloqueAlternativo;
                    continue;
                }

                Log::debug('Bloque rechazado por conflicto no docente', [
                    'grupo' => $grupoId,
                    'bloque' => $bloqueId,
                    'conflictos' => $validacion['conflictos'],
                ]);

                $razon = $mensaje ?: "Conflicto en el bloque {$bloqueId}";
                $conflicto = true;
                break;
            }

            if ($conflicto || empty($planBloques)) {
                $motivo = $razon;
                if (!$motivo) {
                    if (empty($bloqueIds)) {
                        $motivo = 'No se encontró ningún bloque disponible para este grupo';
                    } elseif ($docentePreferidoId) {
                        $motivo = "El docente preferido {$docentePreferidoId} no pudo cubrir los bloques requeridos";
                    } else {
                        $motivo = 'No se pudieron asignar bloques disponibles para este grupo';
                    }
                }
                $rechazos[] = [
                    'grupo_id' => $grupoId,
                    'razon' => $motivo,
                    'bloques' => $bloqueIds,
                    'docente_id' => $docentePreferidoId,
                ];
                continue;
            }

            foreach ($planBloques as $bloqueAsignado) {
                HorarioAsignado::create([
                    'grupo_id' => $grupoId,
                    'docente_id' => $bloqueAsignado['docente_id'],
                    'aula_id' => $aulaId,
                    'bloque_horario_id' => $bloqueAsignado['bloque_id'],
                    'periodo_academico_id' => $periodoId,
                    'modalidad_id' => $modalidad->id,
                    'activo' => true
                ]);
                $asignacionesCreadas++;
            }
        }

        if (!empty($rechazos)) {
            $primero = $rechazos[0];
            $mensaje = "No se pudo generar el horario para el grupo {$primero['grupo_id']}: {$primero['razon']}";
            throw new HorarioGeneracionException($mensaje, $rechazos);
        }

        $gruposProcesados = count($this->asignacion);
        $tasaExito = $gruposProcesados === 0 ? '0%' : round(($asignacionesCreadas / $gruposProcesados) * 100, 2) . '%';

        return [
            'periodo_id' => $periodoId,
            'grupos_procesados' => $gruposProcesados,
            'asignaciones_creadas' => $asignacionesCreadas,
            'tasa_exito' => $tasaExito,
            'valor_objetivo' => $this->calcularValorObjetivo($grupos, $aulas),
            'estadisticas' => [
                'total_aulas_disponibles' => count($aulas),
                'total_bloques_disponibles' => count($bloques),
                'total_docentes_disponibles' => count($docentes)
            ]
        ];
    }

    private function encontrarDocenteDisponible(array $docentes, int $bloqueId, int $periodoId, array $aula): ?array
    {
        $docentesOcupados = HorarioAsignado::where('bloque_horario_id', $bloqueId)
            ->where('periodo_academico_id', $periodoId)
            ->where('activo', true)
            ->pluck('docente_id')
            ->toArray();

        foreach ($docentes as $docente) {
            if (!in_array($docente['id'], $docentesOcupados)) {
                $vetos = $this->restriccionesDocentes[$docente['id']] ?? [];
                $aulaPiso = $aula['piso'] ?? 0;
                if (!empty($vetos) && in_array($aulaPiso, $vetos, true)) {
                    continue;
                }
                return $docente;
            }
        }

        return null;
    }

    /**
     * ✅ CORRECCIÓN: Inicializa el array de ocupación con asignaciones existentes
     */
    private function inicializarOcupacion(array $aulas, array $bloques, Collection $asignacionesExistentes): void
    {
        $this->ocupacion = [];

        // Inicializar todos los slots como disponibles
        foreach ($aulas as $aula) {
            foreach ($bloques as $bloque) {
                $key = $aula['id'] . '|' . $bloque['id'];
                $this->ocupacion[$key] = null;
            }
        }

        // Marcar slots ocupados por asignaciones existentes activas
        foreach ($asignacionesExistentes as $asignacion) {
            $key = $asignacion->aula_id . '|' . $asignacion->bloque_horario_id;
            $this->ocupacion[$key] = $asignacion->grupo_id;
        }

        // Marcar slots ocupados por asignaciones ya realizadas en esta ejecución
        foreach ($this->asignacion as $grupoId => $asignacion) {
            foreach ($asignacion['bloque_ids'] as $bloqueId) {
                $key = $asignacion['aula_id'] . '|' . $bloqueId;
                $this->ocupacion[$key] = $grupoId;
            }
        }
    }

    private function ejecutarHeuristica(array &$grupos, array &$aulas, array &$bloques, array &$docentes, Collection $asignacionesExistentes): void
    {
        // Reutilizar el método de inicialización
        $this->inicializarOcupacion($aulas, $bloques, $asignacionesExistentes);

        usort($grupos, function ($a, $b) {
            if ($a['tamano'] !== $b['tamano']) {
                return $b['tamano'] - $a['tamano'];
            }
            if ($a['tipo'] === 'M' && $b['tipo'] !== 'M') return -1;
            if ($a['tipo'] !== 'M' && $b['tipo'] === 'M') return 1;
            return 0;
        });

        foreach ($grupos as $grupo) {
            if (isset($this->asignacion[$grupo['id']])) {
                continue;
            }
            $mejorPenal = 1e18;
            $mejorPar = null;

            foreach ($aulas as $aula) {
                if ($grupo['tamano'] > $aula['capacidad']) {
                    continue;
                }

                if (!$this->validarTipoAula($aula['tipo'], $grupo['tipo'])) {
                    continue;
                }

                foreach ($bloques as $bloque) {
                    if (in_array($bloque['id'], $grupo['vetos_bloques'])) {
                        continue;
                    }
                    if (in_array($aula['id'], $grupo['vetos_aulas'])) {
                        continue;
                    }

                    $key = $aula['id'] . '|' . $bloque['id'];
                    if ($this->ocupacion[$key] !== null) {
                        continue;
                    }

                    $penal = $this->calcularPenalidad($grupo, $aula);

                    if ($penal < $mejorPenal) {
                        $mejorPenal = $penal;
                        $mejorPar = [
                            'aula_id' => $aula['id'],
                            'bloque_ids' => [$bloque['id']],
                            'pattern' => null,
                            'docente_id' => null
                        ];
                    }
                }
            }

            if ($mejorPar !== null) {
                $this->asignacion[$grupo['id']] = $mejorPar;
                foreach ($mejorPar['bloque_ids'] as $bloqueId) {
                    $key = $mejorPar['aula_id'] . '|' . $bloqueId;
                    $this->ocupacion[$key] = $grupo['id'];
                }
            }
        }
    }

    private function calcularValorObjetivo(array $grupos, array $aulas): float
    {
        $totalAlumnos = 0;
        $totalPenal = 0.0;

        foreach ($grupos as $grupo) {
            if (isset($this->asignacion[$grupo['id']])) {
                $totalAlumnos += $grupo['tamano'];
                $asignacion = $this->asignacion[$grupo['id']];
                $aulaId = $asignacion['aula_id'];
                $bloquesCount = count($asignacion['bloque_ids'] ?? []);

                $aula = collect($aulas)->firstWhere('id', $aulaId);
                if ($aula) {
                    $totalPenal += $this->calcularPenalidad($grupo, $aula) * max(1, $bloquesCount);
                }
            }
        }

        return $totalAlumnos - $totalPenal;
    }

    private function asignarPreferencias(array &$grupos, array &$aulas, array $bloques, array $docentes, int $periodoId, array $bloquesPorHorario): void
    {
        if (empty($this->preferencias)) {
            return;
        }

        $gruposPorId = collect($grupos)->keyBy('id')->toArray();
        $docentesPorId = collect($docentes)->keyBy('id')->toArray();

        foreach ($this->preferencias as $preferencia) {
            $grupoId = $preferencia['grupo_id'];
            $docenteId = $preferencia['docente_id'];
            $pattern = strtoupper($preferencia['pattern'] ?? 'LMV');

            if (!isset($gruposPorId[$grupoId]) || !isset($docentesPorId[$docenteId])) {
                continue;
            }

            if (isset($this->asignacion[$grupoId])) {
                continue;
            }

            $diasPatron = $this->obtenerDiasPorPatron($pattern);
            $mejorPenal = 1e18;
            $mejorPar = null;

            foreach ($aulas as $aula) {
                if ($gruposPorId[$grupoId]['tamano'] > $aula['capacidad']) {
                    continue;
                }

                if (!$this->validarTipoAula($aula['tipo'], $gruposPorId[$grupoId]['tipo'])) {
                    continue;
                }

                foreach ($bloques as $bloque) {
                    if (!in_array($bloque['dia_id'], $diasPatron, true)) {
                        continue;
                    }

                    $bloquesDelPatron = $this->obtenerBloquesPorPatron($bloquesPorHorario, $bloque['horario_id'], $pattern);
                    if (empty($bloquesDelPatron)) {
                        continue;
                    }

                    $ocupado = false;
                    foreach ($bloquesDelPatron as $bloqueSeleccionado) {
                        if (in_array($bloqueSeleccionado['id'], $gruposPorId[$grupoId]['vetos_bloques'])) {
                            $ocupado = true;
                            break;
                        }
                        $key = $aula['id'] . '|' . $bloqueSeleccionado['id'];
                        if (($this->ocupacion[$key] ?? null) !== null) {
                            $ocupado = true;
                            break;
                        }
                    }
                    if ($ocupado) {
                        continue;
                    }

                    if (in_array($aula['id'], $gruposPorId[$grupoId]['vetos_aulas'])) {
                        continue;
                    }

                    $penal = $this->calcularPenalidad($gruposPorId[$grupoId], $aula) * count($bloquesDelPatron);
                    if ($penal < $mejorPenal) {
                        $mejorPenal = $penal;
                        $mejorPar = [
                            'aula_id' => $aula['id'],
                            'bloque_ids' => collect($bloquesDelPatron)->pluck('id')->all(),
                            'pattern' => $pattern,
                            'docente_id' => $docenteId,
                        ];
                    }
                }
            }

            if ($mejorPar !== null) {
                $this->asignacion[$grupoId] = $mejorPar;
                foreach ($mejorPar['bloque_ids'] as $bloqueId) {
                    $key = $mejorPar['aula_id'] . '|' . $bloqueId;
                    $this->ocupacion[$key] = $grupoId;
                }
            }
        }
    }

    private function obtenerBloquesPorPatron(array $bloquesPorHorario, int $horarioId, string $pattern): array
    {
        $dias = $this->obtenerDiasPorPatron($pattern);
        $resultados = [];

        foreach ($dias as $diaId) {
            $bloque = $bloquesPorHorario[$horarioId][$diaId] ?? null;
            if (!$bloque) {
                return [];
            }
            $resultados[] = $bloque;
        }

        return $resultados;
    }

    private function buscarBloqueAlternativo(
        int $grupoId,
        array $aula,
        int $periodoId,
        array $bloques,
        int $bloqueActualId,
        ?int $docentePreferidoId,
        array $docentes
    ): ?array {
        $bloqueActual = collect($bloques)->firstWhere('id', $bloqueActualId);
        if (!$bloqueActual) {
            return null;
        }

        $candidatos = collect($bloques)
            ->where('dia_id', $bloqueActual['dia_id'])
            ->where('id', '!=', $bloqueActualId)
            ->values()
            ->all();

        foreach ($candidatos as $bloque) {
            $docenteIdParaBloque = $docentePreferidoId;

            if (!$docenteIdParaBloque) {
                $docenteDisponible = $this->encontrarDocenteDisponible(
                    $docentes,
                    $bloque['id'],
                    $periodoId,
                    $aula
                );
                if (!$docenteDisponible) {
                    continue;
                }
                $docenteIdParaBloque = $docenteDisponible['id'];
            }

            $validacion = $this->validarAsignacion(
                $grupoId,
                $aula['id'],
                $bloque['id'],
                $periodoId,
                $docenteIdParaBloque,
                null
            );

            if (!$validacion['valido']) {
                continue;
            }

            return [
                'bloque_id' => $bloque['id'],
                'docente_id' => $docenteIdParaBloque,
            ];
        }

        return null;
    }

    /**
     * ✅ CORRECCIÓN CRÍTICA CU12: Lógica de validación reparada
     * Cambio principal: Validar que grupo NO esté en el MISMO BLOQUE (no OR)
     */
    public function validarAsignacion(int $grupoId, int $aulaId, int $bloqueId, int $periodoId, ?int $docenteId = null, ?int $horarioActualId = null): array
    {
        $conflictos = [];

        // Verificar aula disponible en este bloque
        $aulaOcupada = HorarioAsignado::where('aula_id', $aulaId)
            ->where('bloque_horario_id', $bloqueId)
            ->where('periodo_academico_id', $periodoId)
            ->where('activo', true)
            ->where('grupo_id', '!=', $grupoId);
        
        if ($horarioActualId) {
            $aulaOcupada = $aulaOcupada->where('id', '!=', $horarioActualId);
        }
        
        $aulaOcupada = $aulaOcupada->first();

        if ($aulaOcupada) {
            $conflictos[] = 'El aula ya está ocupada en este bloque horario';
        }

        // ✅ CORRECCIÓN: Un grupo NO puede estar en el MISMO bloque horario (no OR lógico)
        $grupoOcupado = HorarioAsignado::where('grupo_id', $grupoId)
            ->where('bloque_horario_id', $bloqueId)
            ->where('periodo_academico_id', $periodoId);
        $grupoOcupado = $grupoOcupado->where('activo', true);
        
        if ($horarioActualId) {
            $grupoOcupado = $grupoOcupado->where('id', '!=', $horarioActualId);
        }
        
        $grupoOcupado = $grupoOcupado->first();

        if ($grupoOcupado) {
            $conflictos[] = 'El grupo ya tiene una clase asignada en este bloque horario';
        }

        return [
            'valido' => empty($conflictos),
            'conflictos' => $conflictos,
            'metadata' => [
                'grupoId' => $grupoId,
                'aulaId' => $aulaId,
                'bloqueId' => $bloqueId,
                'periodoId' => $periodoId,
                'docenteId' => $docenteId,
                'horarioActualId' => $horarioActualId
            ]
        ];
    }

    public function obtenerTiposAula(): array
    {
        return $this->tiposAulaPermitidos;
    }

    public function obtenerModalidadesClase(): array
    {
        return $this->modalidadesClase;
    }

    public function obtenerMetodosAsistencia(): array
    {
        return $this->metodosAsistencia;
    }

    public function esModalidadValida(string $modalidad): bool
    {
        return array_key_exists($modalidad, $this->modalidadesClase);
    }

    public function esMetodoAsistenciaValido(string $metodo): bool
    {
        return array_key_exists($metodo, $this->metodosAsistencia);
    }

    private function obtenerDiasPorPatron(string $pattern): array
    {
        return $this->patterns[$pattern] ?? $this->patterns['LMV'];
    }
}
