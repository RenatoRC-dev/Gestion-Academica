<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BitacoraController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $q = Bitacora::with('usuario');

            if ($request->filled('usuario_id')) {
                $q->where('usuario_id', (int) $request->query('usuario_id'));
            }
            if ($request->filled('accion')) {
                $q->where('accion', $request->query('accion'));
            }
            if ($request->filled('tabla')) {
                $q->where('tabla_afectada', $request->query('tabla'));
            }
            if ($request->filled('desde')) {
                $q->where('fecha_hora', '>=', $request->query('desde'));
            }
            if ($request->filled('hasta')) {
                $q->where('fecha_hora', '<=', $request->query('hasta'));
            }

            $perPage = (int) ($request->query('per_page', 15));
            $bitacoras = $q->orderByDesc('fecha_hora')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $bitacoras,
                'message' => 'Bitácoras obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bitácoras',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Bitacora $bitacora): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $bitacora,
                'message' => 'Bitácora obtenida exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bitácora',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
