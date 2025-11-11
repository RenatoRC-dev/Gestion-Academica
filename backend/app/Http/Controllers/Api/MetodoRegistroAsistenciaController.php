<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MetodoRegistroAsistencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetodoRegistroAsistenciaController extends Controller
{
    /**
     * CU20 - Listar métodos de registro
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) {
                $perPage = 15;
            }

            $query = MetodoRegistroAsistencia::query();

            // Filtro por activo/inactivo
            if ($request->has('activo')) {
                $activo = filter_var($request->query('activo'), FILTER_VALIDATE_BOOLEAN);
                $query->where('activo', $activo);
            }

            $metodos = $query->orderBy('id', 'asc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $metodos,
                'message' => 'Métodos de registro obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener métodos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU20 - Ver detalle de método
     */
    public function show(MetodoRegistroAsistencia $metodoRegistro): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $metodoRegistro,
                'message' => 'Método obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener método',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU20 - Actualizar método de registro (principalmente toggle activo)
     */
    public function update(Request $request, MetodoRegistroAsistencia $metodoRegistro): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'sometimes|required|string|max:100',
                'descripcion' => 'nullable|string|max:255',
                'activo' => 'sometimes|required',
            ]);

            // Si solo se envía activo (toggle)
            if (count($validated) === 1 && isset($validated['activo'])) {
                $nuevoActivo = filter_var($validated['activo'], FILTER_VALIDATE_BOOLEAN);

                $metodoRegistro->activo = $nuevoActivo;
                $metodoRegistro->save();

                return response()->json([
                    'success' => true,
                    'data' => $metodoRegistro,
                    'message' => 'Método actualizado exitosamente'
                ], 200);
            }

            $metodoRegistro->fill($validated);
            $metodoRegistro->save();

            return response()->json([
                'success' => true,
                'data' => $metodoRegistro,
                'message' => 'Método actualizado exitosamente'
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar método',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
