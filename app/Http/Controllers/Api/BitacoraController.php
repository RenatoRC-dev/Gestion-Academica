<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BitacoraController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $bitacoras = Bitacora::paginate(15);
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