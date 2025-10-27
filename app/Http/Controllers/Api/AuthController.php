<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required','email'],
            'password' => ['required','string','min:6'],
        ]);

        $user = Usuario::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        // opcional: verifica si está activo
        if (isset($user->activo) && !$user->activo) {
            return response()->json(['error' => 'Usuario inactivo'], 403);
        }

        $token = $user->createToken('postman')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'email' => $user->email,
                'nombre'=> $user->nombre_completo ?? $user->name ?? null
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada']);
    }

    /**
     * Obtener datos del usuario autenticado (CU21/CU23)
     */
    public function user(Request $request)
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