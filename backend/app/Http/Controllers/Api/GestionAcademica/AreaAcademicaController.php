<?php

namespace App\Http\Controllers\Api\GestionAcademica;

use App\Http\Controllers\Controller;
use App\Models\AreaAcademica;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AreaAcademicaController extends Controller
{
    private function validarAdministrador(): JsonResponse|null
    {
        $usuario = auth()->user();
        $tieneRol = $usuario && $usuario->roles()->where('nombre', 'administrador_academico')->exists();
        if (!$tieneRol) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para administrar áreas académicas'
            ], 403);
        }
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($response = $this->validarAdministrador()) {
            return $response;
        }

        try {
            $query = AreaAcademica::withCount('docentes');
            if ($request->filled('search')) {
                $term = '%' . strtolower((string) $request->query('search')) . '%';
                $query->whereRaw('LOWER(nombre) LIKE ?', [$term]);
            }
            if ($request->has('activo')) {
                $activo = filter_var($request->query('activo'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if (!is_null($activo)) {
                    $query->where('activo', $activo);
                }
            }
            $perPage = (int) $request->query('per_page', 15);
            $areas = $query->orderBy('nombre')->paginate(max(1, $perPage));

            return response()->json([
                'success' => true,
                'data' => $areas,
                'message' => 'Áreas académicas obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al consultar áreas académicas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        if ($response = $this->validarAdministrador()) {
            return $response;
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:150|unique:area_academica,nombre',
            'descripcion' => 'nullable|string',
            'activo' => 'sometimes|boolean',
        ]);

        try {
            DB::beginTransaction();
            $usuarioId = auth()->id();
            $area = AreaAcademica::create([
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null,
                'activo' => $validated['activo'] ?? true,
                'created_by' => $usuarioId,
                'updated_by' => $usuarioId,
            ]);
            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $area,
                'message' => 'Área académica creada exitosamente'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el área académica',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(AreaAcademica $areaAcademica): JsonResponse
    {
        if ($response = $this->validarAdministrador()) {
            return $response;
        }

        try {
            return response()->json([
                'success' => true,
                'data' => $areaAcademica->load('docentes.persona'),
                'message' => 'Área académica obtenida exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el área académica',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, AreaAcademica $areaAcademica): JsonResponse
    {
        if ($response = $this->validarAdministrador()) {
            return $response;
        }

        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:150', Rule::unique('area_academica', 'nombre')->ignore($areaAcademica->id, 'id')],
            'descripcion' => 'nullable|string',
            'activo' => 'sometimes|boolean',
        ]);

        try {
            DB::beginTransaction();
            $actualizar = array_intersect_key($validated, array_flip(['nombre', 'descripcion', 'activo']));
            if (!empty($actualizar)) {
                $actualizar['updated_by'] = auth()->id();
                $areaAcademica->update($actualizar);
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $areaAcademica->fresh(),
                'message' => 'Área académica actualizada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el área académica',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(AreaAcademica $areaAcademica): JsonResponse
    {
        if ($response = $this->validarAdministrador()) {
            return $response;
        }

        try {
            if ($areaAcademica->docentes()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el área porque tiene docentes vinculados'
                ], 409);
            }

            DB::beginTransaction();
            $areaAcademica->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Área académica eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el área académica',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
