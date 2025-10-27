<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BitacoraController extends Controller
{
    /**
     * Listar bitácora con filtros
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'usuario_id' => 'nullable|exists:usuario,id',
                'tabla_afectada' => 'nullable|string',
                'accion' => 'nullable|string',
                'fecha_desde' => 'nullable|date',
                'fecha_hasta' => 'nullable|date',
                'per_page' => 'nullable|integer|min:5|max:100'
            ]);

            $query = Bitacora::query();

            if (isset($validated['usuario_id'])) {
                $query->where('usuario_id', $validated['usuario_id']);
            }

            if (isset($validated['tabla_afectada'])) {
                $query->where('tabla_afectada', $validated['tabla_afectada']);
            }

            if (isset($validated['accion'])) {
                $query->where('accion', 'like', '%' . $validated['accion'] . '%');
            }

            if (isset($validated['fecha_desde'])) {
                $query->whereDate('fecha_hora', '>=', $validated['fecha_desde']);
            }

            if (isset($validated['fecha_hasta'])) {
                $query->whereDate('fecha_hora', '<=', $validated['fecha_hasta']);
            }

            $perPage = $validated['per_page'] ?? 20;
            $registros = $query->orderBy('fecha_hora', 'desc')
                ->with('usuario')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $registros,
                'message' => 'Registros de bitácora obtenidos'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bitácora',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un registro específico con detalles
     */
    public function show(Bitacora $bitacora): JsonResponse
    {
        try {
            $bitacora->load('usuario');

            return response()->json([
                'success' => true,
                'data' => $bitacora,
                'message' => 'Registro obtenido'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener registro',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de auditoría por tabla
     */
    public function resumenPorTabla(): JsonResponse
    {
        try {
            $resumen = Bitacora::selectRaw('tabla_afectada, COUNT(*) as total, accion')
                ->groupBy('tabla_afectada', 'accion')
                ->orderByDesc('total')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $resumen,
                'message' => 'Resumen de auditoría por tabla'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener actividad de un usuario específico
     */
    public function actividadPorUsuario(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'usuario_id' => 'required|exists:usuario,id',
                'dias' => 'nullable|integer|min:1|max:365'
            ]);

            $dias = $validated['dias'] ?? 30;
            $fechaDesde = now()->subDays($dias);

            $actividad = Bitacora::where('usuario_id', $validated['usuario_id'])
                ->where('fecha_hora', '>=', $fechaDesde)
                ->with('usuario')
                ->orderBy('fecha_hora', 'desc')
                ->paginate(50);

            return response()->json([
                'success' => true,
                'data' => $actividad,
                'message' => "Actividad del último usuarios de últimos $dias días"
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exportar cambios de un registro (datos anteriores vs nuevos)
     */
    public function cambiosDelRegistro(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'tabla_afectada' => 'required|string',
                'registro_id' => 'required|integer'
            ]);

            $cambios = Bitacora::where('tabla_afectada', $validated['tabla_afectada'])
                ->where('registro_id', $validated['registro_id'])
                ->orderBy('fecha_hora', 'desc')
                ->get();

            if ($cambios->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay cambios registrados para este registro'
                ], 404);
            }

            $historico = $cambios->map(function ($cambio) {
                return [
                    'fecha' => $cambio->fecha_hora,
                    'usuario' => $cambio->usuario->nombre_completo ?? 'Sistema',
                    'accion' => $cambio->accion,
                    'datos_anteriores' => json_decode($cambio->datos_anteriores, true),
                    'datos_nuevos' => json_decode($cambio->datos_nuevos, true)
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $historico,
                'message' => 'Historial de cambios del registro'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener cambios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Limpiar bitácora antigua (mantener últimos N días)
     */
    public function limpiar(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'dias_antiguos' => 'required|integer|min:30|max:730'
            ]);

            $fechaCorte = now()->subDays($validated['dias_antiguos']);

            $eliminados = Bitacora::where('fecha_hora', '<', $fechaCorte)->delete();

            return response()->json([
                'success' => true,
                'data' => [
                    'registros_eliminados' => $eliminados,
                    'fecha_corte' => $fechaCorte
                ],
                'message' => "Se eliminaron $eliminados registros anteriores a $validated[dias_antiguos] días"
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al limpiar bitácora',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}