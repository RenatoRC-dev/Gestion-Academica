<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Bitacora;
use App\Support\BitacoraFormatter;

class RecordarAuditoria
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tablaAfectada = $this->extraerTabla($request->getPathInfo());
        $registroId = $this->extraerRegistroId($request->getPathInfo());
        $datosAnteriores = $this->obtenerRegistroPrevio($tablaAfectada, $registroId);

        $response = $next($request);

        // Solo registrar en bitácora operaciones que modifiquen datos
        if ($this->debeRegistrarse($request)) {
            $this->registrarEnBitacora($request, $response, $tablaAfectada, $registroId, $datosAnteriores);
        }

        return $response;
    }

    /**
     * Determinar si la operación debe registrarse en bitácora
     */
    private function debeRegistrarse(Request $request): bool
    {
        // Registrar POST, PUT, DELETE
        return in_array($request->getMethod(), ['POST', 'PUT', 'DELETE']);
    }

    /**
     * Registrar la operación en la tabla bitacora
     */
    private function registrarEnBitacora(Request $request, Response $response, ?string $tablaAfectada, ?int $registroId, ?array $datosAnteriores): void
    {
        try {
            $usuario = auth()->user();
            $usuarioId = $usuario ? $usuario->id : null;

            // Determinar tabla afectada del endpoint

        // Obtener datos del request
        $datosNuevos = $request->getMethod() !== 'DELETE' ? BitacoraFormatter::filtrarDatos($request->all()) : null;

            Bitacora::create([
                'usuario_id' => $usuarioId,
                'accion' => $request->getMethod(), // POST, PUT, DELETE
                'tabla_afectada' => $tablaAfectada,
                'registro_id' => $registroId,
                'datos_anteriores' => $datosAnteriores ? json_encode($datosAnteriores) : null,
                'datos_nuevos' => $datosNuevos ? json_encode($datosNuevos) : null,
                'direccion_ip' => $request->ip(),
                'descripcion' => $this->generarDescripcion($request, $response, $tablaAfectada, $registroId, $datosAnteriores, $datosNuevos),
            ]);
        } catch (\Exception $e) {
            // Registrar errores pero no afectar la respuesta al cliente
            \Log::error('Error registrando en bitácora: ' . $e->getMessage());
        }
    }

    /**
     * Extraer tabla afectada del path
     */
    private function extraerTabla(string $path): ?string
    {
        // /api/docentes => docentes
        // /api/horarios/generar => horarios
        preg_match('/\/api\/([a-z-]+)/', $path, $matches);
        return $matches[1] ?? null;
    }

    /**
     * Extraer ID del registro del path
     */
    private function extraerRegistroId(string $path): ?int
    {
        // /api/docentes/5 => 5
        preg_match('/\/(\d+)/', $path, $matches);
        return isset($matches[1]) ? (int)$matches[1] : null;
    }

    /**
     * Generar descripción de la acción
     */
    private function generarDescripcion(Request $request, Response $response, ?string $tabla, ?int $registroId, ?array $prev, ?array $next): string
    {
        $label = $this->formatearEvento($request->getMethod());
        $tablaLabel = $this->humanizarTabla($tabla);
        $identificador = null;
        if ($tablaLabel) {
            $identificador = $tablaLabel;
        }
        if ($registroId) {
            $identificador = ($identificador ? "{$identificador} #" : '#') . $registroId;
        }

        $parts = [$label];
        if ($identificador) {
            $parts[] = $identificador;
        }

        return trim(implode(' ', $parts));
    }

    private function formatearEvento(string $metodo): string
    {
        return match (strtoupper($metodo)) {
            'POST' => 'Creación',
            'PUT' => 'Actualización',
            'DELETE' => 'Eliminación',
            default => strtoupper($metodo),
        };
    }

    private function humanizarTabla(?string $tabla): ?string
    {
        if (!$tabla) {
            return null;
        }
        $map = [
            'areas-academicas' => 'Áreas académicas',
            'areas-administrativas' => 'Áreas administrativas',
            'administrativos' => 'Administrativos',
            'docentes' => 'Docentes',
            'materias' => 'Materias',
            'aulas' => 'Aulas',
            'grupos' => 'Grupos',
            'periodos' => 'Períodos',
            'bloques-horarios' => 'Bloques horarios',
            'estados-asistencia' => 'Estados de asistencia',
            'metodos-registro' => 'Métodos de registro',
            'bitacora' => 'Bitácora',
            'tipos-aula' => 'Tipos de aula',
            'horarios' => 'Horarios',
            'usuarios' => 'Usuarios',
            'roles' => 'Roles',
        ];

        return $map[$tabla] ?? Str::title(str_replace('-', ' ', (string) $tabla));
    }


    private function obtenerRegistroPrevio(?string $tabla, ?int $id): ?array
    {
        if (!$tabla || !$id) {
            return null;
        }
        try {
            $registro = DB::table($tabla)->find($id);
            return $registro ? (array) $registro : null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
