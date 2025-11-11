<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstadoAsistencia;
use App\Models\Asistencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EstadoAsistenciaController extends Controller
{
    /**
     * CU19 - Listar estados de asistencia
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) {
                $perPage = 15;
            }

            $query = EstadoAsistencia::query();

            // Filtro por activo/inactivo
            if ($request->has('activo')) {
                $activo = filter_var($request->query('activo'), FILTER_VALIDATE_BOOLEAN);
                $query->where('activo', $activo);
            }

            // Ordenar por orden ascendente
            $estados = $query->orderBy('orden', 'asc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $estados,
                'message' => 'Estados de asistencia obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estados',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU19 - Ver detalle de estado
     */
    public function show(EstadoAsistencia $estadoAsistencia): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $estadoAsistencia,
                'message' => 'Estado obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU19 - Crear nuevo estado de asistencia
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:50|unique:estado_asistencia,nombre',
                'descripcion' => 'nullable|string|max:255',
                'color' => 'required|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
                'cuenta_como_falta' => 'nullable|boolean',
                'orden' => 'nullable|integer|min:0',
                'activo' => 'nullable|boolean',
            ], [
                'nombre.required' => 'El nombre es requerido',
                'nombre.unique' => 'Ya existe un estado con este nombre',
                'color.required' => 'El color es requerido',
                'color.regex' => 'El color debe ser un código hexadecimal válido (ejemplo: #10B981)',
            ]);

            DB::beginTransaction();

            // Si no se especifica orden, usar el siguiente disponible
            if (!isset($validated['orden'])) {
                $maxOrden = EstadoAsistencia::max('orden') ?? 0;
                $validated['orden'] = $maxOrden + 1;
            }

            $estado = EstadoAsistencia::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $estado,
                'message' => 'Estado de asistencia creado exitosamente'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU19 - Actualizar estado de asistencia
     */
    public function update(Request $request, EstadoAsistencia $estadoAsistencia): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'sometimes|required|string|max:50|unique:estado_asistencia,nombre,' . $estadoAsistencia->id,
                'descripcion' => 'nullable|string|max:255',
                'color' => 'sometimes|required|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
                'cuenta_como_falta' => 'sometimes|required|boolean',
                'orden' => 'sometimes|required|integer|min:0',
                'activo' => 'sometimes|required',
            ]);

            $filtered = array_filter($validated, fn($value) => !is_null($value));

            // Si solo se envía activo (toggle)
            if (count($filtered) === 1 && array_key_exists('activo', $filtered)) {
                $nuevoActivo = filter_var($filtered['activo'], FILTER_VALIDATE_BOOLEAN);

                $estadoAsistencia->activo = $nuevoActivo;
                $estadoAsistencia->save();

                return response()->json([
                    'success' => true,
                    'data' => $estadoAsistencia,
                    'message' => 'Estado actualizado exitosamente'
                ], 200);
            }

            $toUpdate = array_intersect_key($filtered, array_flip([
                'nombre',
                'descripcion',
                'color',
                'cuenta_como_falta',
                'orden',
                'activo'
            ]));

            if (!empty($toUpdate)) {
                $estadoAsistencia->update($toUpdate);
            }

            return response()->json([
                'success' => true,
                'data' => $estadoAsistencia,
                'message' => 'Estado actualizado exitosamente'
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
                'message' => 'Error al actualizar estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU19 - Eliminar estado de asistencia
     */
    public function destroy(EstadoAsistencia $estadoAsistencia): JsonResponse
    {
        // Validar que NO esté en uso en asistencias
        $enUso = Asistencia::where('estado_id', $estadoAsistencia->id)->exists();

        if ($enUso) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un estado que está en uso en asistencias registradas'
            ], 422);
        }

        DB::beginTransaction();

        try {
            $estadoAsistencia->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Estado eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
