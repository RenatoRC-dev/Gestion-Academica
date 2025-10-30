<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UsuarioController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $usuarios = Usuario::with('roles')->paginate(15);
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

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre_completo' => 'required|string|max:255',
                'email' => 'required|email|unique:usuario,email',
                'activo' => 'nullable|boolean',
            ], [
                'nombre_completo.required' => 'El nombre es requerido',
                'email.required' => 'El email es requerido',
                'email.unique' => 'Este email ya existe',
            ]);

            DB::beginTransaction();

            $password = Str::random(12);

            $usuario = Usuario::create([
                'nombre_completo' => $validated['nombre_completo'],
                'email' => $validated['email'],
                'password_hash' => bcrypt($password),
                'activo' => $validated['activo'] ?? true,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $usuario->load('roles'),
                'message' => 'Usuario creado exitosamente',
                'password_temporal' => $password
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Usuario $usuario): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $usuario->load('roles'),
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

    public function update(Request $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre_completo' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:usuario,email,' . $usuario->id,
                'activo' => 'nullable|boolean',
            ]);

            DB::beginTransaction();

            $usuario->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $usuario->fresh()->load('roles'),
                'message' => 'Usuario actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Usuario $usuario): JsonResponse
    {
        try {
            // ✅ CORRECCIÓN: No permitir eliminar el último administrador
            $adminCount = Usuario::whereHas('roles', function($q) {
                $q->where('nombre', 'administrador_academico');
            })->count();

            if ($adminCount === 1 && $usuario->roles()->where('nombre', 'administrador_academico')->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el último administrador del sistema'
                ], 422);
            }

            DB::beginTransaction();
            $usuario->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}