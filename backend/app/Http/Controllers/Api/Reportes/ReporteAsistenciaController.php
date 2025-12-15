<?php

namespace App\Http\Controllers\Api\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\ReporteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AsistenciaExport;
use Illuminate\Support\Facades\Log;

class ReporteAsistenciaController extends Controller
{
    protected $reporteService;

    public function __construct(ReporteService $reporteService)
    {
        $this->reporteService = $reporteService;
    }

    /**
     * CU28 - Generar reporte estático (preview)
     */
    public function generar(Request $request): JsonResponse
    {
        try {
            $filtros = $request->only([
                'docente_id',
                'estado_id',
                'metodo_registro_id',
                'fecha_inicio',
                'fecha_fin',
                'periodo_id',
                'grupo_id',
                'materia_id'
            ]);

            $datos = $this->reporteService->generarReporte($filtros);

            // Simplificar asistencias para JSON (evitar recursión)
            $asistenciasSimplificadas = $datos['asistencias']->map(function ($a) {
                return [
                    'id' => $a->id,
                    'fecha_hora_registro' => $a->fecha_hora_registro,
                    'docente' => [
                        'nombre' => $a->docente?->persona
                            ? $a->docente->persona->nombre . ' ' . $a->docente->persona->apellido_paterno
                            : 'N/A'
                    ],
                    'materia' => $a->horarioAsignado?->grupo?->materia?->nombre ?? 'N/A',
                    'grupo' => $a->horarioAsignado?->grupo?->nombre ?? 'N/A',
                    'estado' => [
                        'nombre' => $a->estado?->nombre ?? 'N/A',
                        'color' => $a->estado?->color ?? '#10B981'
                    ],
                    'metodo' => $a->metodoRegistro?->nombre ?? 'N/A',
                    'observaciones' => $a->observaciones
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'asistencias' => $asistenciasSimplificadas,
                    'estadisticas' => $datos['estadisticas'],
                    'por_metodo' => $datos['por_metodo'],
                    'por_estado' => $datos['por_estado'],
                    'por_dia' => $datos['por_dia'],
                    'filtros' => $datos['filtros']
                ],
                'message' => 'Reporte generado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar reporte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU29 - Exportar reporte a PDF
     */
    public function exportarPDF(Request $request)
    {
        try {
            $filtros = $request->only([
                'docente_id',
                'estado_id',
                'metodo_registro_id',
                'fecha_inicio',
                'fecha_fin',
                'periodo_id',
                'grupo_id',
                'materia_id'
            ]);

            $datos = $this->reporteService->generarReporte($filtros);
            $registros = $this->reporteService->formatearParaExportacion($datos);

            $pdf = Pdf::loadView('reportes.asistencia-pdf', [
                'registros' => $registros,
                'estadisticas' => $datos['estadisticas'],
                'filtros' => $datos['filtros'],
                'fecha_generacion' => now()->format('d/m/Y H:i:s')
            ]);

            $nombreArchivo = 'reporte_asistencia_' . now()->format('YmdHis') . '.pdf';

            return $pdf->download($nombreArchivo);
        } catch (\Exception $e) {
            Log::error('Error exportando PDF', ['exception' => $e, 'filtros' => $request->all()]);
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar PDF: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU30 - Exportar reporte a Excel
     */
    public function exportarExcel(Request $request)
    {
        try {
            $filtros = $request->only([
                'docente_id',
                'estado_id',
                'metodo_registro_id',
                'fecha_inicio',
                'fecha_fin',
                'periodo_id',
                'grupo_id',
                'materia_id'
            ]);

            $datos = $this->reporteService->generarReporte($filtros);
            $registros = $this->reporteService->formatearParaExportacion($datos);

            $nombreArchivo = 'reporte_asistencia_' . now()->format('YmdHis') . '.xlsx';

            return Excel::download(new AsistenciaExport($registros, $datos['estadisticas']), $nombreArchivo);
        } catch (\Exception $e) {
            Log::error('Error exportando Excel', ['exception' => $e, 'filtros' => $request->all()]);
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar Excel: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
