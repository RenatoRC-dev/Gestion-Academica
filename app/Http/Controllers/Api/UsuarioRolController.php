<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UsuarioRolController extends Controller
{
    /**
     * Obtener roles asignados a un usuario
     */
    public function rolesDelUsuario(Usuario $usuario): JsonResponse
    {
        try {
            $roles = $usuario->roles()->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'usuario_id' => $usuario->id,
                    'roles' => $roles
                ],
                'message' => 'Roles del usuario obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles del usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar rol a usuario
     */
    public function asignarRol(Request $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rol_id' => 'required|exists:rol,id'
            ]);

            $rol = Rol::find($validated['rol_id']);

            // Verificar si ya tiene el rol
            if ($usuario->roles()->where('rol_id', $rol->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario ya tiene asignado este rol'
                ], 409);
            }

            $usuario->roles()->attach($rol->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'usuario_id' => $usuario->id,
                    'rol_id' => $rol->id,
                    'rol_nombre' => $rol->nombre
                ],
                'message' => 'Rol asignado al usuario exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Revocar rol de usuario
     */
    public function revocarRol(Request $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rol_id' => 'required|exists:rol,id'
            ]);

            $rol = Rol::find($validated['rol_id']);

            // Verificar que no sea el último rol de admin
            if ($rol->nombre === 'admin') {
                $usuariosAdmin = \App\Models\UsuarioRol::where('rol_id', $rol->id)->count();
                if ($usuariosAdmin === 1 && $usuario->roles()->where('rol_id', $rol->id)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se puede revocar el último rol de administrador del sistema'
                    ], 403);
                }
            }

            if (!$usuario->roles()->where('rol_id', $rol->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario no tiene asignado este rol'
                ], 404);
            }

            $usuario->roles()->detach($rol->id);

            return response()->json([
                'success' => true,
                'message' => 'Rol revocado del usuario exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al revocar rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar múltiples roles (reemplaza roles existentes)
     */
    public function sincronizarRoles(Request $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rol_ids' => 'required|array',
                'rol_ids.*' => 'exists:rol,id'
            ]);

            // Verificar que no intente remover todos los admin
            $rolesAdmin = Rol::where('nombre', 'admin')->pluck('id')->toArray();
            $tieneRolAdmin = $usuario->roles()->whereIn('rol_id', $rolesAdmin)->exists();

            if ($tieneRolAdmin && !in_array($rolesAdmin[0], $validated['rol_ids'])) {
                $usuariosAdmin = \App\Models\UsuarioRol::where('rol_id', $rolesAdmin[0])->count();
                if ($usuariosAdmin === 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se puede remover el único administrador del sistema'
                    ], 403);
                }
            }

            $usuario->roles()->sync($validated['rol_ids']);

            $rolesActuales = $usuario->roles()->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'usuario_id' => $usuario->id,
                    'roles' => $rolesActuales
                ],
                'message' => 'Roles sincronizados exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al sincronizar roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}