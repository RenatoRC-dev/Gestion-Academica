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
    /**
     * Lista todos los docentes con sus personas
     */
    public function index(): JsonResponse
    {
        try {
            $docentes = Docente::with('persona.usuario')
                ->paginate(15);

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

    /**
     * Crea un nuevo docente (persona + usuario + docente)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre_completo' => 'required|string|max:255',
                'email' => 'required|email|unique:usuario,email',
                'ci' => 'required|string|unique:persona,ci',
                'telefono_contacto' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:500',
                'codigo_docente' => 'required|string|unique:docente,codigo_docente',
                'password' => 'required|string|min:8',
            ]);

            DB::beginTransaction();

            // 1. Crear Usuario
            $usuario = Usuario::create([
                'nombre_completo' => $validated['nombre_completo'],
                'email' => $validated['email'],
                'password_hash' => bcrypt($validated['password']),
                'activo' => true,
            ]);

            // 2. Crear Persona
            $persona = Persona::create([
                'usuario_id' => $usuario->id,
                'nombre_completo' => $validated['nombre_completo'],
                'ci' => $validated['ci'],
                'telefono_contacto' => $validated['telefono_contacto'] ?? null,
                'direccion' => $validated['direccion'] ?? null,
            ]);

            // 3. Crear Docente
            $docente = Docente::create([
                'persona_id' => $persona->id,
                'codigo_docente' => $validated['codigo_docente'],
            ]);

            // Asignar rol docente
            $rol = \App\Models\Rol::where('nombre', 'docente')->first();
            if ($rol) {
                $usuario->roles()->attach($rol);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $docente->load('persona.usuario'),
                'message' => 'Docente creado exitosamente'
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

    /**
     * Obtiene un docente específico
     */
    public function show(Docente $docente): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $docente->load(['persona.usuario', 'areas', 'horariosAsignados']),
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

    /**
     * Actualiza un docente
     */
    public function update(Request $request, Docente $docente): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre_completo' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:usuario,email,' . $docente->persona->usuario_id,
                'ci' => 'sometimes|string|unique:persona,ci,' . $docente->persona_id,
                'telefono_contacto' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:500',
                'codigo_docente' => 'sometimes|string|unique:docente,codigo_docente,' . $docente->persona_id . ',persona_id',
            ]);

            DB::beginTransaction();

            // Actualizar Docente
            if (isset($validated['codigo_docente'])) {
                $docente->update(['codigo_docente' => $validated['codigo_docente']]);
            }

            // Actualizar Persona
            $persona = $docente->persona;
            if (isset($validated['nombre_completo'])) {
                $persona->update(['nombre_completo' => $validated['nombre_completo']]);
            }
            if (isset($validated['ci'])) {
                $persona->update(['ci' => $validated['ci']]);
            }
            if (isset($validated['telefono_contacto'])) {
                $persona->update(['telefono_contacto' => $validated['telefono_contacto']]);
            }
            if (isset($validated['direccion'])) {
                $persona->update(['direccion' => $validated['direccion']]);
            }

            // Actualizar Usuario
            $usuario = $persona->usuario;
            if (isset($validated['nombre_completo'])) {
                $usuario->update(['nombre_completo' => $validated['nombre_completo']]);
            }
            if (isset($validated['email'])) {
                $usuario->update(['email' => $validated['email']]);
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

    /**
     * Elimina un docente
     */
    public function destroy(Docente $docente): JsonResponse
    {
        try {
            // Verificar si tiene horarios
            if ($docente->horariosAsignados()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el docente porque tiene horarios asignados'
                ], 409);
            }

            DB::beginTransaction();

            $usuarioId = $docente->persona->usuario_id;
            $personaId = $docente->persona_id;

            // Eliminar en orden: Docente → Persona → Usuario
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