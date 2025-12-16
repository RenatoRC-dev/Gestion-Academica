<?php

namespace App\Http\Controllers\Api\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\ReporteEstadisticoService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReporteEstadisticoController extends Controller
{
    protected $reporteService;

    public function __construct(ReporteEstadisticoService $reporteService)
    {
        $this->reporteService = $reporteService;
    }

    public function mensual(): JsonResponse
    {
        try {
            $datos = $this->reporteService->obtenerReporteMensual();

            return response()->json([
                'success' => true,
                'data' => $datos,
                'message' => 'Reporte mensual generado correctamente',
            ]);
        } catch (\Throwable $e) {
            Log::error('Error generando reporte mensual', ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'No se pudo obtener el reporte mensual',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function exportarPdf(Request $request)
    {
        try {
            $datos = $this->reporteService->obtenerReporteMensual();
            $pdf = Pdf::loadView('reportes.estadistico-mensual', [
                'datos' => $datos,
                'fecha_generacion' => now()->format('d/m/Y H:i:s'),
            ]);

            $nombreArchivo = 'reporte_estadistico_mensual_' . now()->format('YmdHis') . '.pdf';
            return $pdf->download($nombreArchivo);
        } catch (\Throwable $e) {
            Log::error('Error exportando reporte mensual', ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'No se pudo exportar el reporte mensual',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
