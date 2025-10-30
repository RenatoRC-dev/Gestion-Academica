<?php

namespace App\Services;

use App\Models\Grupo;
use App\Models\BloqueHorario;
use App\Models\Aula;
use App\Models\HorarioAsignado;
use App\Models\Docente;
use App\Models\ModalidadClase;
use App\Models\PeriodoAcademico;
use Illuminate\Support\Collection;

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

    public function __construct(float $delta = 0.15, float $lambda = 2.0, int $piso = 5)
    {
        $this->DELTA = $delta;
        $this->LAMBDA = $lambda;
        $this->PISO_ALTO = $piso;
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

        // ✅ NUEVO: Verificar si ya existen horarios para este período
        $horariosExistentes = HorarioAsignado::where('periodo_academico_id', $periodoId)->count();
        if ($horariosExistentes > 0) {
            throw new \Exception("Ya existen horarios generados para este período. " .
                "Elimine los horarios existentes antes de generar nuevos.");
        }

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
                    'hora_inicio' => $b->horario->hora_inicio,
                    'hora_fin' => $b->horario->hora_fin,
                    'codigo' => $b->dia->nombre . ' ' . $b->horario->hora_inicio
                ];
            })
            ->toArray();

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

        $this->ejecutarHeuristica($grupos, $aulas, $bloques, $docentes);

        $asignacionesCreadas = 0;
        $modalidad = ModalidadClase::where('nombre', 'Presencial')->first();

        foreach ($this->asignacion as $grupoId => $asignacion) {
            [$aulaId, $bloqueId] = $asignacion;

            $docente = $this->encontrarDocenteDisponible(
                $docentes,
                $bloqueId,
                $periodoId
            );

            if (!$docente) {
                continue;
            }

            // ✅ CORRECCIÓN CRÍTICA CU10: Validar conflictos ANTES de crear
            $validacion = $this->validarAsignacion(
                $grupoId,
                $aulaId,
                $bloqueId,
                $periodoId,
                $docente['id'],
                null
            );

            if (!$validacion['valido']) {
                // Saltar grupo si hay conflictos
                continue;
            }

            HorarioAsignado::create([
                'grupo_id' => $grupoId,
                'docente_id' => $docente['id'],
                'aula_id' => $aulaId,
                'bloque_horario_id' => $bloqueId,
                'periodo_academico_id' => $periodoId,
                'modalidad_id' => $modalidad->id
            ]);

            $asignacionesCreadas++;
        }

        return [
            'periodo_id' => $periodoId,
            'grupos_procesados' => count($grupos),
            'asignaciones_creadas' => $asignacionesCreadas,
            'tasa_exito' => round(($asignacionesCreadas / count($grupos)) * 100, 2) . '%',
            'valor_objetivo' => $this->calcularValorObjetivo($grupos, $aulas),
            'estadisticas' => [
                'total_aulas_disponibles' => count($aulas),
                'total_bloques_disponibles' => count($bloques),
                'total_docentes_disponibles' => count($docentes)
            ]
        ];
    }

    private function encontrarDocenteDisponible(array $docentes, int $bloqueId, int $periodoId): ?array
    {
        $docentesOcupados = HorarioAsignado::where('bloque_horario_id', $bloqueId)
            ->where('periodo_academico_id', $periodoId)
            ->pluck('docente_id')
            ->toArray();

        foreach ($docentes as $docente) {
            if (!in_array($docente['id'], $docentesOcupados)) {
                return $docente;
            }
        }

        return null;
    }

    private function ejecutarHeuristica(array &$grupos, array &$aulas, array &$bloques, array &$docentes): void
    {
        $this->asignacion = [];
        $this->ocupacion = [];

        foreach ($aulas as $aula) {
            foreach ($bloques as $bloque) {
                $key = $aula['id'] . '|' . $bloque['id'];
                $this->ocupacion[$key] = null;
            }
        }

        usort($grupos, function ($a, $b) {
            if ($a['tamano'] !== $b['tamano']) {
                return $b['tamano'] - $a['tamano'];
            }
            if ($a['tipo'] === 'M' && $b['tipo'] !== 'M') return -1;
            if ($a['tipo'] !== 'M' && $b['tipo'] === 'M') return 1;
            return 0;
        });

        foreach ($grupos as $grupo) {
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
                        $mejorPar = [$aula['id'], $bloque['id']];
                    }
                }
            }

            if ($mejorPar !== null) {
                $this->asignacion[$grupo['id']] = $mejorPar;
                $key = $mejorPar[0] . '|' . $mejorPar[1];
                $this->ocupacion[$key] = $grupo['id'];
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
                [$aulaId, $_] = $this->asignacion[$grupo['id']];
                
                $aula = collect($aulas)->firstWhere('id', $aulaId);
                if ($aula) {
                    $totalPenal += $this->calcularPenalidad($grupo, $aula);
                }
            }
        }

        return $totalAlumnos - $totalPenal;
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
        
        if ($horarioActualId) {
            $grupoOcupado = $grupoOcupado->where('id', '!=', $horarioActualId);
        }
        
        $grupoOcupado = $grupoOcupado->first();

        if ($grupoOcupado) {
            $conflictos[] = 'El grupo ya tiene una clase asignada en este bloque horario';
        }

        // Verificar docente disponible
        if ($docenteId) {
            $docenteOcupado = HorarioAsignado::where('docente_id', $docenteId)
                ->where('bloque_horario_id', $bloqueId)
                ->where('periodo_academico_id', $periodoId)
                ->where('grupo_id', '!=', $grupoId);
            
            if ($horarioActualId) {
                $docenteOcupado = $docenteOcupado->where('id', '!=', $horarioActualId);
            }
            
            $docenteOcupado = $docenteOcupado->first();

            if ($docenteOcupado) {
                $conflictos[] = 'El docente ya tiene una clase asignada en este bloque horario';
            }
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
}