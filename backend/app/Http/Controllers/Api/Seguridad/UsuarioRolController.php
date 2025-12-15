<?php

namespace App\Http\Controllers\Api\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\Rol;
use App\Models\Docente;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class UsuarioRolController extends Controller
{
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
                'message' => 'Roles del usuario obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles del usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function asignarRol(Request $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rol_id' => 'required|exists:rol,id',
            ], [
                'rol_id.required' => 'El ID del rol es requerido',
                'rol_id.exists' => 'El rol no existe',
            ]);

            $rol = Rol::find($validated['rol_id']);

            if ($usuario->roles()->where('rol_id', $rol->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario ya tiene asignado este rol'
                ], 409);
            }

            DB::beginTransaction();

            $usuario->roles()->attach($rol->id);

            if ($rol->nombre === 'docente') {
                $this->ensureDocenteRecord($usuario);
            }

            DB::commit();

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
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function revocarRol(Request $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rol_id' => 'required|exists:rol,id',
            ], [
                'rol_id.required' => 'El ID del rol es requerido',
                'rol_id.exists' => 'El rol no existe',
            ]);

            $rol = Rol::find($validated['rol_id']);

            if (!$usuario->roles()->where('rol_id', $rol->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario no tiene asignado este rol'
                ], 404);
            }

            DB::beginTransaction();

            $usuario->roles()->detach($rol->id);

            if ($rol->nombre === 'docente') {
                $this->removeDocenteRecord($usuario);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Rol revocado del usuario exitosamente'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al revocar rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function sincronizarRoles(Request $request, Usuario $usuario): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rol_ids' => 'required|array',
                'rol_ids.*' => 'exists:rol,id',
            ], [
                'rol_ids.required' => 'Los IDs de roles son requeridos',
                'rol_ids.array' => 'Los roles deben ser un array',
            ]);

            DB::beginTransaction();

            $usuario->roles()->sync($validated['rol_ids']);

            $rolesActuales = $usuario->roles()->get();
            if ($rolesActuales->contains('nombre', 'docente')) {
                $this->ensureDocenteRecord($usuario);
            } else {
                $this->removeDocenteRecord($usuario);
            }

            DB::commit();

        return response()->json([
            'success' => true,
            'data' => [
                'usuario_id' => $usuario->id,
                'roles' => $rolesActuales
            ],
            'message' => 'Roles sincronizados exitosamente'
        ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al sincronizar roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function ensureDocenteRecord(Usuario $usuario): void
    {
        $persona = $usuario->persona;
        if (!$persona) {
            return;
        }
        if (Docente::where('persona_id', $persona->id)->exists()) {
            return;
        }
        Docente::create([
            'persona_id' => $persona->id,
            'codigo_docente' => sprintf('DOC-%04d', $persona->id),
            'created_by' => $usuario->id,
            'updated_by' => $usuario->id,
        ]);
    }

    private function removeDocenteRecord(Usuario $usuario): void
    {
        $persona = $usuario->persona;
        if (!$persona) {
            return;
        }
        Docente::where('persona_id', $persona->id)->delete();
    }
}
