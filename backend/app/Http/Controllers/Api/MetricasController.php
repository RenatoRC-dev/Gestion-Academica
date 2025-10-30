<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use App\Models\Docente;
use App\Models\Materia;
use App\Models\Aula;
use App\Models\Grupo;
use App\Models\PeriodoAcademico;
use App\Models\Usuario;

class MetricasController extends Controller
{
    /**
     * Obtener métricas generales del sistema
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerMetricasGenerales()
    {
        try {
            $metricas = [
                'total_docentes' => Docente::count(),
                'total_materias' => Materia::count(),
                'total_aulas' => Aula::count(),
                'total_grupos' => Grupo::count(),
                'total_periodos' => PeriodoAcademico::count(),
                'total_usuarios' => Usuario::count(),
            ];

            return response()->json($metricas);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener métricas',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}