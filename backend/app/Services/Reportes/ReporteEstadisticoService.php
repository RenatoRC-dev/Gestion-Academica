<?php

namespace App\Services\Reportes;

use App\Models\Asistencia;
use App\Models\Aula;
use App\Models\Docente;
use App\Models\HorarioAsignado;
use Carbon\Carbon;

class ReporteEstadisticoService
{
    public function obtenerReporteMensual(): array
    {
        $inicio = Carbon::now()->startOfMonth();
        $fin = Carbon::now()->endOfDay();

        $docentesActivos = Docente::whereHas('persona.usuario', function ($query) {
            $query->where('activo', true);
        })->count();

        $totalAulas = Aula::where('activo', true)->count();

        $asistenciasMensuales = Asistencia::with(['estado', 'horarioAsignado.aula'])
            ->whereBetween('fecha_hora_registro', [$inicio, $fin])
            ->get();

        $aulasOcupadas = (int) $asistenciasMensuales
            ->pluck('horarioAsignado.aula_id')
            ->filter()
            ->unique()
            ->count();

        $ahora = Carbon::now();
        $horaActual = $ahora->format('H:i:s');
        $fechaActual = $ahora->format('Y-m-d');
        $diaActual = $ahora->isoWeekday();

        $ocupadasActualIds = HorarioAsignado::where('activo', true)
            ->where(function ($query) use ($fechaActual) {
                $query->whereNull('fecha_especifica')
                    ->orWhere('fecha_especifica', $fechaActual);
            })
            ->whereHas('periodo', function ($query) use ($fechaActual) {
                $query->whereDate('fecha_inicio', '<=', $fechaActual)
                    ->whereDate('fecha_fin', '>=', $fechaActual);
            })
            ->whereHas('bloqueHorario', function ($query) use ($diaActual, $horaActual) {
                $query->where('dia_id', $diaActual)
                    ->whereHas('horario', function ($query) use ($horaActual) {
                        $query->where('hora_inicio', '<=', $horaActual)
                            ->where('hora_fin', '>', $horaActual);
                    });
            })
            ->pluck('aula_id')
            ->filter()
            ->unique();

        $aulasOcupadasActual = $ocupadasActualIds->count();

        $aulasLibres = Aula::where('activo', true)
            ->whereNotIn('id', $ocupadasActualIds->all())
            ->orderBy('codigo_aula')
            ->get(['id', 'codigo_aula', 'ubicacion', 'piso']);

        $presentes = $asistenciasMensuales
            ->filter(function ($asistencia) {
                return $asistencia->estado && $asistencia->estado->nombre === 'Presente';
            })
            ->count();

        $totalAsistencias = $asistenciasMensuales->count();
        $porcentajeAsistencia = $totalAsistencias > 0
            ? round(($presentes / $totalAsistencias) * 100, 2)
            : 0;

        $nombrePeriodo = $inicio->copy()->locale('es')->isoFormat('MMMM YYYY');

        return [
            'docentes_activos' => $docentesActivos,
            'aulas_totales' => $totalAulas,
            'aulas_ocupadas' => $aulasOcupadasActual,
            'aulas_libres' => $aulasLibres->count(),
            'total_asistencias' => $totalAsistencias,
            'presentes' => $presentes,
            'porcentaje_asistencia' => $porcentajeAsistencia,
            'periodo' => [
                'nombre' => $nombrePeriodo,
                'inicio' => $inicio->format('d/m/Y'),
                'fin' => $fin->format('d/m/Y'),
            ],
            'hora_actual' => $ahora->format('H:i'),
            'aulas_libres_detalles' => $aulasLibres
                ->map(function (Aula $aula) {
                    return [
                        'id' => $aula->id,
                        'codigo_aula' => $aula->codigo_aula,
                        'ubicacion' => $aula->ubicacion,
                        'piso' => $aula->piso,
                    ];
                })
                ->values()
                ->toArray(),
        ];
    }
}
