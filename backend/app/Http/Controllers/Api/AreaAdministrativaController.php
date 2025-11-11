<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AreaAdministrativa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AreaAdministrativaController extends Controller
{
    /**
     * CU08 - Listar todas las áreas administrativas
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) {
                $perPage = 15;
            }

            $query = AreaAdministrativa::withCount('administrativos');

            // Filtro por búsqueda
            if ($request->has('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                      ->orWhere('descripcion', 'like', "%{$search}%");
                });
            }

            // Filtro por estado activo
            if ($request->has('activo')) {
                $activo = filter_var($request->query('activo'), FILTER_VALIDATE_BOOLEAN);
                $query->where('activo', $activo);
            }

            $areas = $query->orderBy('nombre')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $areas,
                'message' => 'Áreas administrativas obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener áreas administrativas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU08 - Obtener un área administrativa específica
     */
    public function show(AreaAdministrativa $areaAdministrativa): JsonResponse
    {
        try {
            $areaAdministrativa->load('administrativos');

            return response()->json([
                'success' => true,
                'data' => $areaAdministrativa,
                'message' => 'Área administrativa obtenida exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el área administrativa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU08 - Crear una nueva área administrativa
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:100|unique:area_administrativa,nombre',
                'descripcion' => 'nullable|string|max:500',
                'activo' => 'nullable|boolean',
            ], [
                'nombre.required' => 'El nombre es requerido',
                'nombre.unique' => 'Ya existe un área administrativa con este nombre',
                'nombre.max' => 'El nombre no debe superar 100 caracteres',
                'descripcion.max' => 'La descripción no debe superar 500 caracteres',
            ]);

            DB::beginTransaction();

            $usuarioActual = auth()->user();

            $area = AreaAdministrativa::create([
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null,
                'activo' => $validated['activo'] ?? true,
                'created_by' => $usuarioActual->id,
                'updated_by' => $usuarioActual->id,
            ]);

            $area->load('administrativos');

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $area,
                'message' => 'Área administrativa creada exitosamente'
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
                'message' => 'Error al crear el área administrativa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU08 - Actualizar un área administrativa
     */
    public function update(Request $request, AreaAdministrativa $areaAdministrativa): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:100',
                    Rule::unique('area_administrativa', 'nombre')->ignore($areaAdministrativa->id)
                ],
                'descripcion' => 'nullable|string|max:500',
                'activo' => 'nullable|boolean',
            ], [
                'nombre.unique' => 'Ya existe un área administrativa con este nombre',
                'nombre.max' => 'El nombre no debe superar 100 caracteres',
                'descripcion.max' => 'La descripción no debe superar 500 caracteres',
            ]);

            DB::beginTransaction();

            $usuarioActual = auth()->user();

            $areaAdministrativa->fill($validated);
            $areaAdministrativa->updated_by = $usuarioActual->id;
            $areaAdministrativa->save();

            $areaAdministrativa->load('administrativos');

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $areaAdministrativa,
                'message' => 'Área administrativa actualizada exitosamente'
            ], 200);
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
                'message' => 'Error al actualizar el área administrativa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU08 - Eliminar un área administrativa
     */
    public function destroy(AreaAdministrativa $areaAdministrativa): JsonResponse
    {
        DB::beginTransaction();

        try {
            // Validar que no tenga administrativos asociados
            if ($areaAdministrativa->administrativos()->count() > 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un área administrativa que tiene usuarios asociados'
                ], 422);
            }

            $areaAdministrativa->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Área administrativa eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el área administrativa',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
