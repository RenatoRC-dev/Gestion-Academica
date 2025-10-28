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

    // Tipos de aula permitidos (del seeder)
    private array $tiposAulaPermitidos = [
        'Aula Teoría',
        'Laboratorio',
        'Taller',
        'Auditorio'
    ];

    // Modalidades de clase disponibles
    private array $modalidadesClase = [
        'Presencial' => 'Clase presencial',
        'Virtual' => 'Clase virtual',
        'Híbrida' => 'Clase híbrida'
    ];

    // Métodos de registro de asistencia disponibles
    private array $metodosAsistencia = [
        'QR' => 'Código QR',
        'Manual' => 'Registro manual',
        'Biométrico' => 'Biométrico',
        'Confirmación Virtual' => 'Confirmación virtual'
    ];

    private array $asignacion = [];       // grupo_id => [aula_id, bloque_id]
    private array $ocupacion = [];        // "aula|bloque" => grupo_id

    /**
     * Constructor con parámetros configurables
     */
    public function __construct(float $delta = 0.15, float $lambda = 2.0, int $piso = 5)
    {
        $this->DELTA = $delta;
        $this->LAMBDA = $lambda;
        $this->PISO_ALTO = $piso;
    }

    /**
     * Calcular penalidad por asignación
     * Penaliza: asientos vacíos + pisos altos sin ascensor
     */
    private function calcularPenalidad(array $grupo, array $aula): float
    {
        $vacios = $aula['capacidad'] - $grupo['tamano'];
        $delta = $this->DELTA * $aula['capacidad'];
        
        // Penalidad por asientos vacíos (solo si excede tolerancia)
        $penVacios = $this->LAMBDA * max(0, $vacios - $delta);
        
        // Penalidad por piso alto sin ascensor
        $penPiso = 0;
        if (!$this->tiene_ascensor && $aula['piso'] >= $this->PISO_ALTO) {
            $penPiso = $this->PENAL_PISO;
        }
        
        return $penVacios + $penPiso;
    }

    /**
     * Validar compatibilidad entre grupo y tipo de aula
     * Permite asignación flexible pero prioriza compatibilidad
     */
    private function validarTipoAula(string $tipoAula, string $tipoGrupo): bool
    {
        // Todos los grupos pueden ir a cualquier aula (flexible)
        // Pero esta validación permite agregar restricciones específicas si es necesario
        return true;
    }

    /**
     * Generar horario automático para un período
     * CU10 - Generar Horario Automáticamente
     */
    public function generarHorario(int $periodoId): array
    {
        $periodo = PeriodoAcademico::find($periodoId);
        if (!$periodo) {
            throw new \Exception("Periodo académico no encontrado");
        }

        // Obtener grupos del período
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

        // Obtener aulas con tipo específico (Aula Teoría, Laboratorio, Taller, Auditorio)
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

        // Obtener bloques horarios
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

        // Obtener docentes disponibles
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

        // Ejecutar heurística
        $this->ejecutarHeuristica($grupos, $aulas, $bloques, $docentes);

        // Guardar asignaciones en BD
        $asignacionesCreadas = 0;
        $modalidad = ModalidadClase::where('nombre', 'Presencial')->first();

        foreach ($this->asignacion as $grupoId => $asignacion) {
            [$aulaId, $bloqueId] = $asignacion;

            // Seleccionar docente aleatorio disponible
            $docente = collect($docentes)->random();

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

    /**
     * Ejecutar heurística de asignación de horarios
     * Adaptado de algoritmo.py (curso IO)
     */
    private function ejecutarHeuristica(array &$grupos, array &$aulas, array &$bloques, array &$docentes): void
    {
        $this->asignacion = [];
        $this->ocupacion = [];

        // 1. Inicializar ocupación vacía (matriz de disponibilidad)
        foreach ($aulas as $aula) {
            foreach ($bloques as $bloque) {
                $key = $aula['id'] . '|' . $bloque['id'];
                $this->ocupacion[$key] = null;
            }
        }

        // 2. Ordenar grupos (grandes primero para mejor colocación)
        usort($grupos, function ($a, $b) {
            if ($a['tamano'] !== $b['tamano']) {
                return $b['tamano'] - $a['tamano']; // Descendente por tamaño
            }
            // Entre iguales, tipo M antes que C
            if ($a['tipo'] === 'M' && $b['tipo'] !== 'M') return -1;
            if ($a['tipo'] !== 'M' && $b['tipo'] === 'M') return 1;
            return 0;
        });

        // 3. Asignar cada grupo al mejor (aula, bloque) según penalidad
        foreach ($grupos as $grupo) {
            $mejorPenal = 1e18;
            $mejorPar = null;

            foreach ($aulas as $aula) {
                // Validar capacidad (aula debe tener espacio)
                if ($grupo['tamano'] > $aula['capacidad']) {
                    continue;
                }

                // Validar compatibilidad de tipo de aula
                if (!$this->validarTipoAula($aula['tipo'], $grupo['tipo'])) {
                    continue;
                }

                foreach ($bloques as $bloque) {
                    // Validar vetos (bloques/aulas rechazadas)
                    if (in_array($bloque['id'], $grupo['vetos_bloques'])) {
                        continue;
                    }
                    if (in_array($aula['id'], $grupo['vetos_aulas'])) {
                        continue;
                    }

                    // Verificar disponibilidad (aula libre en bloque)
                    $key = $aula['id'] . '|' . $bloque['id'];
                    if ($this->ocupacion[$key] !== null) {
                        continue;
                    }

                    // Calcular penalidad (función objetivo)
                    $penal = $this->calcularPenalidad($grupo, $aula);

                    // Seleccionar mejor opción
                    if ($penal < $mejorPenal) {
                        $mejorPenal = $penal;
                        $mejorPar = [$aula['id'], $bloque['id']];
                    }
                }
            }

            // Si encuentra asignación válida, guardar
            if ($mejorPar !== null) {
                $this->asignacion[$grupo['id']] = $mejorPar;
                $key = $mejorPar[0] . '|' . $mejorPar[1];
                $this->ocupacion[$key] = $grupo['id'];
            }
        }
    }

    /**
     * Calcular valor objetivo (función de mérito final)
     * total_alumnos - penalidad_total
     */
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
     * Validar conflicto antes de modificar horario manualmente
     * CU12 - Modificar Horario Manualmente
     */
    public function validarAsignacion(int $grupoId, int $aulaId, int $bloqueId, int $periodoId, ?int $docenteId = null): array
    {
        $conflictos = [];

        // Verificar aula disponible en este bloque
        $aulaOcupada = HorarioAsignado::where('aula_id', $aulaId)
            ->where('bloque_horario_id', $bloqueId)
            ->where('periodo_academico_id', $periodoId)
            ->where('grupo_id', '!=', $grupoId)
            ->first();

        if ($aulaOcupada) {
            $conflictos[] = 'El aula ya está ocupada en este bloque horario';
        }

        // Verificar grupo no esté en otro lugar simultáneamente
        $grupoOcupado = HorarioAsignado::where('grupo_id', $grupoId)
            ->where('periodo_academico_id', $periodoId)
            ->where('aula_id', '!=', $aulaId)
            ->orWhere('bloque_horario_id', '!=', $bloqueId)
            ->first();

        if ($grupoOcupado) {
            $conflictos[] = 'El grupo ya tiene una clase en otro horario/aula';
        }

        // Verificar docente disponible
        if ($docenteId) {
            $docenteOcupado = HorarioAsignado::where('docente_id', $docenteId)
                ->where('bloque_horario_id', $bloqueId)
                ->where('periodo_academico_id', $periodoId)
                ->where('grupo_id', '!=', $grupoId)
                ->first();

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
                'docenteId' => $docenteId
            ]
        ];
    }

    /**
     * Obtener tipos de aula disponibles
     */
    public function obtenerTiposAula(): array
    {
        return $this->tiposAulaPermitidos;
    }

    /**
     * Obtener modalidades de clase disponibles
     */
    public function obtenerModalidadesClase(): array
    {
        return $this->modalidadesClase;
    }

    /**
     * Obtener métodos de registro de asistencia disponibles
     */
    public function obtenerMetodosAsistencia(): array
    {
        return $this->metodosAsistencia;
    }

    /**
     * Validar que la modalidad es válida
     */
    public function esModalidadValida(string $modalidad): bool
    {
        return array_key_exists($modalidad, $this->modalidadesClase);
    }

    /**
     * Validar que el método de asistencia es válido
     */
    public function esMetodoAsistenciaValido(string $metodo): bool
    {
        return array_key_exists($metodo, $this->metodosAsistencia);
    }
}