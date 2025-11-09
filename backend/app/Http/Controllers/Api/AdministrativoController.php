<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Administrativo;
use App\Models\Persona;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdministrativoController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $this->ensureAdminEntriesFromRoles();

            $administrativos = Administrativo::with(['persona.usuario', 'areaAdministrativa'])->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $administrativos,
                'message' => 'Administrativos obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener administrativos',
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
                'cargo' => 'required|string|max:100',
                'area_administrativa_id' => 'nullable|exists:area_administrativa,id',
                'telefono_contacto' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:500',
            ], [
                'nombre_completo.required' => 'El nombre es requerido',
                'email.required' => 'El correo es requerido',
                'email.unique' => 'Este correo ya existe',
                'ci.required' => 'El CI es requerido',
                'ci.unique' => 'Este CI ya existe',
                'cargo.required' => 'El cargo es requerido',
            ]);

            DB::beginTransaction();

            $usuario = Usuario::create([
                'nombre_completo' => $validated['nombre_completo'],
                'email' => $validated['email'],
                'password_hash' => bcrypt($validated['ci']),
                'activo' => true,
            ]);

            $persona = Persona::create([
                'usuario_id' => $usuario->id,
                'nombre_completo' => $validated['nombre_completo'],
                'ci' => $validated['ci'],
                'telefono_contacto' => $validated['telefono_contacto'] ?? null,
                'direccion' => $validated['direccion'] ?? null,
            ]);

            $administrativo = Administrativo::create([
                'persona_id' => $persona->id,
                'cargo' => $validated['cargo'],
                'area_administrativa_id' => $validated['area_administrativa_id'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $administrativo->load(['persona.usuario', 'areaAdministrativa']),
                'message' => 'Administrativo creado exitosamente',
                'password_temporal' => $validated['ci'],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear administrativo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Administrativo $administrativo): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $administrativo->load(['persona.usuario', 'areaAdministrativa']),
                'message' => 'Administrativo obtenido exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener administrativo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Administrativo $administrativo): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre_completo' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:usuario,email,' . $administrativo->persona->usuario_id,
                'ci' => 'sometimes|string|unique:persona,ci,' . $administrativo->persona_id,
                'cargo' => 'sometimes|string|max:100',
                'area_administrativa_id' => 'nullable|exists:area_administrativa,id',
                'telefono_contacto' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:500',
            ]);

            DB::beginTransaction();

            if (isset($validated['cargo']) || array_key_exists('area_administrativa_id', $validated)) {
                $administrativo->update([
                    'cargo' => $validated['cargo'] ?? $administrativo->cargo,
                    'area_administrativa_id' => $validated['area_administrativa_id'] ?? $administrativo->area_administrativa_id,
                ]);
            }

            $persona = $administrativo->persona;
            if ($persona) {
                $persona->update(array_filter([
                    'nombre_completo' => $validated['nombre_completo'] ?? null,
                    'ci' => $validated['ci'] ?? null,
                    'telefono_contacto' => $validated['telefono_contacto'] ?? null,
                    'direccion' => $validated['direccion'] ?? null,
                ], fn ($val) => $val !== null));
            }

            $usuario = $persona?->usuario;
            if ($usuario) {
                $usuario->update(array_filter([
                    'nombre_completo' => $validated['nombre_completo'] ?? null,
                    'email' => $validated['email'] ?? null,
                ], fn ($val) => $val !== null));
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $administrativo->fresh()->load(['persona.usuario', 'areaAdministrativa']),
                'message' => 'Administrativo actualizado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar administrativo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Administrativo $administrativo): JsonResponse
    {
        try {
            DB::beginTransaction();

            $persona = $administrativo->persona;
            $usuario = $persona?->usuario;

            $administrativo->delete();
            $persona?->delete();
            $usuario?->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Administrativo eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar administrativo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function ensureAdminEntriesFromRoles(): void
    {
        $personaIds = Administrativo::pluck('persona_id')->toArray();
        $usuarios = Usuario::whereHas('roles', function ($query) {
            $query->where('nombre', 'administrador_academico');
        })
        ->with('persona')
        ->get();

        foreach ($usuarios as $usuario) {
            $persona = $usuario->persona;
            if (!$persona) {
                continue;
            }

            if (in_array($persona->id, $personaIds, true)) {
                continue;
            }

            Administrativo::create([
                'persona_id' => $persona->id,
                'cargo' => 'Administración académica',
                'area_administrativa_id' => null,
            ]);

            $personaIds[] = $persona->id;
        }
    }
}
