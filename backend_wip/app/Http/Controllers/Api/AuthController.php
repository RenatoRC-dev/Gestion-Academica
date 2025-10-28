<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string|min:6',
            ], [
                'email.required' => 'El email es requerido',
                'email.email' => 'El email debe ser válido',
                'password.required' => 'La contraseña es requerida',
                'password.min' => 'La contraseña debe tener al menos 6 caracteres',
            ]);

            $user = Usuario::where('email', $data['email'])->first();

            if (!$user || !Hash::check($data['password'], $user->password_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales inválidas'
                ], 401);
            }

            if (isset($user->activo) && !$user->activo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario inactivo'
                ], 403);
            }

            $token = $user->createToken('api_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'nombre_completo' => $user->nombre_completo ?? $user->name ?? null
                ],
                'message' => 'Sesión iniciada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar sesión',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json([
                'success' => true,
                'message' => 'Sesión cerrada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function user(Request $request): JsonResponse
    {
        try {
            $usuario = $request->user();
            $usuario->load('roles');

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $usuario->id,
                    'nombre_completo' => $usuario->nombre_completo,
                    'email' => $usuario->email,
                    'activo' => $usuario->activo,
                    'roles' => $usuario->roles()->pluck('nombre')->toArray()
                ],
                'message' => 'Datos del usuario obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener datos del usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}