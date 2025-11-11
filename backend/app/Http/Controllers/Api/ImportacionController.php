<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImportacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
                'tipo_importacion' => 'required|in:docentes,estudiantes,usuarios',
            ], [
                'archivo.required' => 'Debe proporcionar un archivo',
                'archivo.mimes' => 'El archivo debe ser Excel (.xlsx, .xls) o CSV',
                'archivo.max' => 'El archivo no debe superar los 5MB',
                'tipo_importacion.required' => 'El tipo de importación es requerido',
                'tipo_importacion.in' => 'Tipo de importación no válido',
            ]);

            // Guardar temporalmente el archivo
            $archivo = $request->file('archivo');
            $rutaTemporal = $archivo->store('temp', 'local');
            $rutaCompleta = storage_path('app/' . $rutaTemporal);

            // Validar y obtener vista previa
            $resultado = $this->importacionService->validarArchivo(
                $request->tipo_importacion,
                $rutaCompleta
            );

            // Limpiar archivo temporal
            Storage::disk('local')->delete($rutaTemporal);

            return response()->json([
                'success' => true,
                'data' => $resultado,
                'message' => 'Validación completada'
            ], 200);
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
                'tipo_importacion' => 'required|in:docentes,estudiantes,usuarios',
            ], [
                'archivo.required' => 'Debe proporcionar un archivo',
                'archivo.mimes' => 'El archivo debe ser Excel (.xlsx, .xls) o CSV',
                'archivo.max' => 'El archivo no debe superar los 5MB',
                'tipo_importacion.required' => 'El tipo de importación es requerido',
                'tipo_importacion.in' => 'Tipo de importación no válido',
            ]);

            $archivo = $request->file('archivo');
            $nombreArchivo = time() . '_' . $archivo->getClientOriginalName();
            $rutaArchivo = $archivo->storeAs('importaciones', $nombreArchivo, 'local');
            $rutaCompleta = storage_path('app/' . $rutaArchivo);

            $usuarioActual = auth()->user();

            // Procesar importación
            $resultado = $this->importacionService->procesarArchivo(
                $request->tipo_importacion,
                $rutaCompleta,
                $usuarioActual->id
            );

            return response()->json([
                'success' => true,
                'data' => $resultado['log'],
                'message' => $resultado['mensaje']
            ], 200);
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
            $tipo = $request->query('tipo', 'docentes');

            if (!in_array($tipo, ['docentes', 'estudiantes', 'usuarios'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tipo de plantilla no válido'
                ], 400);
            }

            $rutaPlantilla = storage_path("app/plantillas/plantilla_{$tipo}.xlsx");

            if (!file_exists($rutaPlantilla)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Plantilla no encontrada'
                ], 404);
            }

            return response()->download($rutaPlantilla, "plantilla_{$tipo}.xlsx");
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar plantilla',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
