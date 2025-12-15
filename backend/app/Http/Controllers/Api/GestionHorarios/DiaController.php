<?php

namespace App\Http\Controllers\Api\GestionHorarios;

use App\Http\Controllers\Controller;
use App\Models\Dia;
use Illuminate\Http\JsonResponse;

class DiaController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $dias = Dia::orderBy('id')->get();
            return response()->json([
                'success' => true,
                'data' => $dias,
                'message' => 'Días obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener días',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
