<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Http\Request\StoreUsuarioRequest;
use App\Http\Request\UpdateUsuarioRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    /**
     * CU23: Listar todos los usuarios
     */
    public function index(): JsonResponse
    {
        try {
            $usuarios = Usuario::select('id', 'nombre_completo', 'email', 'activo', 'created_at', 'updated_at')
                ->with('roles')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $usuarios,
                'message' => 'Usuarios obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU23: Obtener un usuario específico
     */
    public function show(Usuario $usuario): JsonResponse
    {
        try {
            $usuario->load('roles');

            return response()->json([
                'success' => true,
                'data' => $usuario,
                'message' => 'Usuario obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU23: Crear nuevo usuario
     */
    public function store(StoreUsuarioRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $usuario = Usuario::create([
                'nombre_completo' => $validated['nombre_completo'],
                'email' => $validated['email'],
                'password_hash' => Hash::make($validated['password']),
                'activo' => $validated['activo'] ?? true,
            ]);

            return response()->json([
                'success' => true,
                'data' => $usuario,
                'message' => 'Usuario creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU23: Actualizar usuario
     */
    public function update(UpdateUsuarioRequest $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validated();

            // Actualizar email si cambia
            if (isset($validated['email']) && $validated['email'] !== $usuario->email) {
                $usuario->email = $validated['email'];
            }

            // Actualizar nombre si se proporciona
            if (isset($validated['nombre_completo'])) {
                $usuario->nombre_completo = $validated['nombre_completo'];
            }

            // Actualizar contraseña si se proporciona
            if (isset($validated['password']) && !empty($validated['password'])) {
                $usuario->password_hash = Hash::make($validated['password']);
            }

            // Actualizar estado activo
            if (isset($validated['activo'])) {
                $usuario->activo = $validated['activo'];
            }

            $usuario->save();

            return response()->json([
                'success' => true,
                'data' => $usuario,
                'message' => 'Usuario actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CU23: Eliminar usuario (soft delete - desactivar)
     */
    public function destroy(Usuario $usuario): JsonResponse
    {
        try {
            // Validación: no eliminar al admin principal
            $esAdminPrincipal = $usuario->roles()
                ->where('nombre', 'administrador')
                ->exists();

            if ($esAdminPrincipal) {
                // Verificar si es el único admin
                $totalAdmins = Usuario::whereHas('roles', function ($q) {
                    $q->where('nombre', 'administrador');
                })->count();

                if ($totalAdmins === 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se puede eliminar el último administrador del sistema'
                    ], 409);
                }
            }

            // Soft delete: desactivar en lugar de eliminar
            $usuario->activo = false;
            $usuario->save();

            return response()->json([
                'success' => true,
                'message' => 'Usuario desactivado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}