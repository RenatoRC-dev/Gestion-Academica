<?php

namespace App\Http\Controllers\Api\GestionAcademica;

use App\Http\Controllers\Controller;
use App\Models\TipoAula;
use App\Models\Aula;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TipoAulaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) {
                $perPage = 15;
            }
            $query = TipoAula::query();
            if ($request->filled('activo')) {
                $activo = filter_var($request->query('activo'), FILTER_VALIDATE_BOOLEAN);
                $query->where('activo', $activo);
            }
            $tipos = $query->orderBy('nombre', 'asc')->paginate($perPage);
            return response()->json([
                'success' => true,
                'data' => $tipos,
                'message' => 'Tipos de aula obtenidos correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tipos de aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:tipo_aula,nombre',
            'descripcion' => 'nullable|string|max:255',
            'activo' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $tipo = TipoAula::create([
                'nombre' => $request->input('nombre'),
                'descripcion' => $request->input('descripcion'),
                'activo' => $request->boolean('activo', true),
            ]);
            DB::commit();
            return response()->json([
                'success' => true,
                'data' => $tipo,
                'message' => 'Tipo de aula creado correctamente'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear tipo de aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, TipoAula $tipoAula): JsonResponse
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:100|unique:tipo_aula,nombre,' . $tipoAula->id,
            'descripcion' => 'nullable|string|max:255',
            'activo' => 'nullable|boolean',
        ]);

        try {
            $tipoAula->update(array_filter([
                'nombre' => $request->input('nombre'),
                'descripcion' => $request->input('descripcion'),
                'activo' => $request->has('activo') ? $request->boolean('activo') : null,
            ], fn($value) => !is_null($value)));

            return response()->json([
                'success' => true,
                'data' => $tipoAula,
                'message' => 'Tipo de aula actualizado correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar tipo de aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(TipoAula $tipoAula): JsonResponse
    {
        $enUso = Aula::where('tipo_aula_id', $tipoAula->id)->exists();
        if ($enUso) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un tipo en uso por aulas existentes',
            ], 422);
        }

        try {
            $tipoAula->delete();
            return response()->json([
                'success' => true,
                'message' => 'Tipo de aula eliminado correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar tipo de aula',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
