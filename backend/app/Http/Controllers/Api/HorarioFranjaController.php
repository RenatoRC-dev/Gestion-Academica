<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Horario;
use Illuminate\Http\JsonResponse;

class HorarioFranjaController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $horarios = Horario::orderBy('hora_inicio')->get();
            return response()->json([
                'success' => true,
                'data' => $horarios,
                'message' => 'Horarios obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener horarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
