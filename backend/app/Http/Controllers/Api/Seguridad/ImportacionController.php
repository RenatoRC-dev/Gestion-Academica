<?php

namespace App\Http\Controllers\Api\Seguridad;

use App\Http\Controllers\Controller;
use App\Exports\PlantillaDocentesExport;
use App\Services\Seguridad\ImportacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportacionController extends Controller
{
    protected $importacionService;

    public function __construct(ImportacionService $importacionService)
    {
        $this->importacionService = $importacionService;
    }

    /**
     * CU24 - Validar archivo antes de importar (vista previa)
     */
    public function validar(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'archivo' => 'required|file|mimes:xlsx,xls,csv|max:5120', // 5MB max
            ], [
                'archivo.required' => 'Debe proporcionar un archivo',
                'archivo.mimes' => 'El archivo debe ser Excel (.xlsx, .xls) o CSV',
                'archivo.max' => 'El archivo no debe superar los 5MB',
            ]);

            // Guardar temporalmente el archivo
            $archivo = $request->file('archivo');
            $rutaTemporal = $archivo->store('temp', 'local');
            $rutaCompleta = storage_path('app/' . $rutaTemporal);

            try {
            $resultado = $this->importacionService->validarArchivo(
                'docentes',
                $rutaCompleta
            );

                return response()->json([
                    'success' => true,
                    'data' => $resultado,
                    'message' => 'Validación completada'
                ], 200);
            } finally {
                Storage::disk('local')->delete($rutaTemporal);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al validar archivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU24 - Procesar importación masiva
     */
    public function importar(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'archivo' => 'required|file|mimes:xlsx,xls,csv|max:5120',
            ], [
                'archivo.required' => 'Debe proporcionar un archivo',
                'archivo.mimes' => 'El archivo debe ser Excel (.xlsx, .xls) o CSV',
                'archivo.max' => 'El archivo no debe superar los 5MB',
            ]);

            $archivo = $request->file('archivo');
            $nombreArchivo = time() . '_' . $archivo->getClientOriginalName();
            $rutaArchivo = $archivo->storeAs('importaciones', $nombreArchivo, 'local');
            $rutaCompleta = storage_path('app/' . $rutaArchivo);

            $usuarioActual = auth()->user();

            try {
            $resultado = $this->importacionService->procesarArchivo(
                'docentes',
                $rutaCompleta,
                $usuarioActual->id
            );

                return response()->json([
                    'success' => true,
                    'data' => $resultado['log'],
                    'message' => $resultado['mensaje']
                ], 200);
            } finally {
                Storage::disk('local')->delete($rutaArchivo);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar importación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU24 - Obtener historial de importaciones
     */
    public function historial(Request $request): JsonResponse
    {
        try {
            $filtros = $request->only(['tipo_importacion']);
            $historial = $this->importacionService->obtenerHistorial($filtros);

            return response()->json([
                'success' => true,
                'data' => $historial,
                'message' => 'Historial obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU24 - Descargar plantilla Excel de ejemplo
     */
    public function descargarPlantilla(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        try {
            return Excel::download(new PlantillaDocentesExport(), 'plantilla_docentes.xlsx');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar plantilla',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
