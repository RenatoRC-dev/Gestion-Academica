<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Docente;
use App\Models\Persona;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocenteController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $docentes = Docente::with('persona.usuario')->paginate(15);
            return response()->json([
                'success' => true,
                'data' => $docentes,
                'message' => 'Docentes obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener docentes',
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
                'ci' => 'required|string|unique:persona,ci',
                'codigo_docente' => 'required|string|unique:docente,codigo_docente',
                'telefono_contacto' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:500',
            ], [
                'nombre_completo.required' => 'El nombre es requerido',
                'email.required' => 'El email es requerido',
                'email.unique' => 'Este email ya existe',
                'ci.required' => 'El CI es requerido',
                'ci.unique' => 'Este CI ya existe',
                'codigo_docente.required' => 'El código de docente es requerido',
                'codigo_docente.unique' => 'Este código ya existe',
            ]);

            DB::beginTransaction();

            $password = $validated['ci'];

            $usuario = Usuario::create([
                'nombre_completo' => $validated['nombre_completo'],
                'email' => $validated['email'],
                'password_hash' => bcrypt($password),
                'activo' => true,
            ]);

            $persona = Persona::create([
                'usuario_id' => $usuario->id,
                'nombre_completo' => $validated['nombre_completo'],
                'ci' => $validated['ci'],
                'telefono_contacto' => $validated['telefono_contacto'] ?? null,
                'direccion' => $validated['direccion'] ?? null,
            ]);

            $docente = Docente::create([
                'persona_id' => $persona->id,
                'codigo_docente' => $validated['codigo_docente'],
            ]);

            $rol = \App\Models\Rol::where('nombre', 'docente')->first();
            if ($rol) {
                $usuario->roles()->attach($rol);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $docente->load('persona.usuario'),
                'message' => 'Docente creado exitosamente',
                'password_temporal' => $password
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear docente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Docente $docente): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $docente->load('persona.usuario'),
                'message' => 'Docente obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener docente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Docente $docente): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre_completo' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:usuario,email,' . $docente->persona->usuario_id . ',id',
                'ci' => 'sometimes|string|unique:persona,ci,' . $docente->persona_id . ',id',
                'codigo_docente' => 'sometimes|string|unique:docente,codigo_docente,' . $docente->id . ',id',
                'telefono_contacto' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:500',
            ]);

            DB::beginTransaction();

            if (isset($validated['codigo_docente'])) {
                $docente->update(['codigo_docente' => $validated['codigo_docente']]);
            }

            $persona = $docente->persona;
            if (isset($validated['nombre_completo']) || isset($validated['ci']) || isset($validated['telefono_contacto']) || isset($validated['direccion'])) {
                $persona->update(array_intersect_key($validated, array_flip(['nombre_completo', 'ci', 'telefono_contacto', 'direccion'])));
            }

            $usuario = $persona->usuario;
            if (isset($validated['nombre_completo']) || isset($validated['email'])) {
                $usuario->update(array_intersect_key($validated, array_flip(['nombre_completo', 'email'])));
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $docente->fresh()->load('persona.usuario'),
                'message' => 'Docente actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar docente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Docente $docente): JsonResponse
    {
        try {
            // Validar que no tenga horarios asignados activos
            $tieneHorarios = \App\Models\HorarioAsignado::where('docente_id', $docente->persona_id)->exists();

            if ($tieneHorarios) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el docente porque tiene horarios asignados'
                ], 409);
            }

            DB::beginTransaction();

            $usuarioId = $docente->persona->usuario_id;
            $personaId = $docente->persona_id;

            $docente->delete();
            Persona::destroy($personaId);
            Usuario::destroy($usuarioId);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Docente eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar docente',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
