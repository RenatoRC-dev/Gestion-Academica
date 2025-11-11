<?php

namespace App\Services;

use App\Models\Asistencia;
use Illuminate\Support\Facades\DB;

class ReporteService
{
    /**
     * Genera datos de reporte con filtros
     */
    public function generarReporte(array $filtros): array
    {
        $query = Asistencia::with([
            'horarioAsignado.grupo.materia',
            'horarioAsignado.bloqueHorario.dia',
            'horarioAsignado.bloqueHorario.horario',
            'horarioAsignado.periodo',
            'docente.persona',
            'estado',
            'metodoRegistro'
        ]);

        // Aplicar filtros
        if (!empty($filtros['docente_id'])) {
            $query->where('docente_id', $filtros['docente_id']);
        }

        if (!empty($filtros['estado_id'])) {
            $query->where('estado_id', $filtros['estado_id']);
        }

        if (!empty($filtros['metodo_registro_id'])) {
            $query->where('metodo_registro_id', $filtros['metodo_registro_id']);
        }

        if (!empty($filtros['fecha_inicio']) && !empty($filtros['fecha_fin'])) {
            $query->whereBetween('fecha_hora_registro', [
                $filtros['fecha_inicio'] . ' 00:00:00',
                $filtros['fecha_fin'] . ' 23:59:59'
            ]);
        }

        if (!empty($filtros['periodo_id'])) {
            $query->whereHas('horarioAsignado', function ($q) use ($filtros) {
                $q->where('periodo_academico_id', $filtros['periodo_id']);
            });
        }

        if (!empty($filtros['grupo_id'])) {
            $query->whereHas('horarioAsignado', function ($q) use ($filtros) {
                $q->where('grupo_id', $filtros['grupo_id']);
            });
        }

        if (!empty($filtros['materia_id'])) {
            $query->whereHas('horarioAsignado.grupo', function ($q) use ($filtros) {
                $q->where('materia_id', $filtros['materia_id']);
            });
        }

        // Obtener datos
        $asistencias = $query->orderBy('fecha_hora_registro', 'desc')->get();

        // Calcular estadísticas
        $totalClases = $asistencias->count();
        $presentes = $asistencias->filter(function ($a) {
            return $a->estado && $a->estado->nombre === 'Presente';
        })->count();

        $faltas = $asistencias->filter(function ($a) {
            return $a->estado && $a->estado->cuenta_como_falta;
        })->count();

        $justificadas = $asistencias->filter(function ($a) {
            return $a->estado && stripos($a->estado->nombre, 'Justificada') !== false;
        })->count();

        $porcentajeAsistencia = $totalClases > 0 ? round(($presentes / $totalClases) * 100, 2) : 0;

        // Agrupar por método
        $porMetodo = $asistencias->groupBy(function ($a) {
            return $a->metodoRegistro ? $a->metodoRegistro->nombre : 'Sin método';
        })->map(function ($items) {
            return $items->count();
        });

        // Agrupar por estado
        $porEstado = $asistencias->groupBy(function ($a) {
            return $a->estado ? $a->estado->nombre : 'Sin estado';
        })->map(function ($items) {
            return $items->count();
        });

        // Asistencias por día de la semana
        $porDia = $asistencias->groupBy(function ($a) {
            $bloque = $a->horarioAsignado?->bloqueHorario;
            return $bloque?->dia?->nombre ?? 'Sin día';
        })->map(function ($items) {
            return $items->count();
        });

        return [
            'asistencias' => $asistencias,
            'estadisticas' => [
                'total_clases' => $totalClases,
                'presentes' => $presentes,
                'faltas' => $faltas,
                'justificadas' => $justificadas,
                'porcentaje_asistencia' => $porcentajeAsistencia,
            ],
            'por_metodo' => $porMetodo,
            'por_estado' => $porEstado,
            'por_dia' => $porDia,
            'filtros' => $filtros,
        ];
    }

    /**
     * Formatea datos para exportación
     */
    public function formatearParaExportacion(array $datos): array
    {
        $registros = [];

        foreach ($datos['asistencias'] as $asistencia) {
            $registros[] = [
                'Fecha' => $asistencia->fecha_hora_registro?->format('d/m/Y H:i'),
                'Docente' => $asistencia->docente?->persona
                    ? $asistencia->docente->persona->nombre . ' ' . $asistencia->docente->persona->apellido_paterno
                    : 'N/A',
                'Materia' => $asistencia->horarioAsignado?->grupo?->materia?->nombre ?? 'N/A',
                'Grupo' => $asistencia->horarioAsignado?->grupo?->nombre ?? 'N/A',
                'Día' => $asistencia->horarioAsignado?->bloqueHorario?->dia?->nombre ?? 'N/A',
                'Horario' => ($asistencia->horarioAsignado?->bloqueHorario?->horario)
                    ? $asistencia->horarioAsignado->bloqueHorario->horario->hora_inicio . ' - ' .
                      $asistencia->horarioAsignado->bloqueHorario->horario->hora_fin
                    : 'N/A',
                'Estado' => $asistencia->estado?->nombre ?? 'N/A',
                'Método' => $asistencia->metodoRegistro?->nombre ?? 'N/A',
                'Observaciones' => $asistencia->observaciones ?? '',
            ];
        }

        return $registros;
    }
}
