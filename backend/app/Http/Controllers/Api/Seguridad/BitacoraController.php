<?php

namespace App\Http\Controllers\Api\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use App\Support\BitacoraFormatter;
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
            $bitacoras->getCollection()->transform(function ($entry) {
                $prev = $entry->datos_anteriores ? json_decode($entry->datos_anteriores, true) : null;
                $next = $entry->datos_nuevos ? json_decode($entry->datos_nuevos, true) : null;
                $cambios = BitacoraFormatter::buildDiffEntries($prev, $next);
                $entry->cambios = $cambios;
                $entry->detalle_resumido = BitacoraFormatter::buildDiffText($cambios);
                return $entry;
            });

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
            $prev = $bitacora->datos_anteriores ? json_decode($bitacora->datos_anteriores, true) : null;
            $next = $bitacora->datos_nuevos ? json_decode($bitacora->datos_nuevos, true) : null;
            $cambios = BitacoraFormatter::buildDiffEntries($prev, $next);
            $bitacora->cambios = $cambios;
            $bitacora->detalle_resumido = BitacoraFormatter::buildDiffText($cambios);
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
