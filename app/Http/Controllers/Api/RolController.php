<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RolController extends Controller
{
    /**
     * Listar todos los roles
     */
    public function index(): JsonResponse
    {
        try {
            $roles = Rol::paginate(20);

            return response()->json([
                'success' => true,
                'data' => $roles,
                'message' => 'Roles obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo rol
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|unique:rol,nombre|max:50',
                'descripcion' => 'nullable|string|max:500'
            ]);

            $rol = Rol::create([
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'data' => $rol,
                'message' => 'Rol creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un rol específico
     */
    public function show(Rol $rol): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $rol,
                'message' => 'Rol obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar rol
     */
    public function update(Request $request, Rol $rol): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => 'nullable|string|unique:rol,nombre,' . $rol->id . '|max:50',
                'descripcion' => 'nullable|string|max:500'
            ]);

            // Proteger roles base del sistema
            $rolesProtegidos = ['admin', 'docente', 'autoridad'];
            if (in_array($rol->nombre, $rolesProtegidos) && isset($validated['nombre'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede cambiar el nombre de los roles base del sistema'
                ], 403);
            }

            if (isset($validated['nombre'])) {
                $rol->nombre = $validated['nombre'];
            }
            if (isset($validated['descripcion'])) {
                $rol->descripcion = $validated['descripcion'];
            }

            $rol->save();

            return response()->json([
                'success' => true,
                'data' => $rol,
                'message' => 'Rol actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar rol (validar que no esté en uso)
     */
    public function destroy(Rol $rol): JsonResponse
    {
        try {
            // Proteger roles base del sistema
            $rolesProtegidos = ['admin', 'docente', 'autoridad'];
            if (in_array($rol->nombre, $rolesProtegidos)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pueden eliminar los roles base del sistema'
                ], 403);
            }

            // Verificar si hay usuarios asignados a este rol
            $usuariosAsignados = $rol->usuarios()->count();

            if ($usuariosAsignados > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "No se puede eliminar este rol porque hay $usuariosAsignados usuario(s) asignado(s)"
                ], 409);
            }

            $rol->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rol eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}