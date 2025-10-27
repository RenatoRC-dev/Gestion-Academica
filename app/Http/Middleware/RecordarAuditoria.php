<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Bitacora;

class RecordarAuditoria
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Solo registrar cambios en métodos que modifiquen datos
        if (in_array($request->getMethod(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $this->registrarAuditoria($request, $response);
        }

        return $response;
    }

    /**
     * Registrar cambio en bitácora
     */
    private function registrarAuditoria(Request $request, Response $response): void
    {
        try {
            $usuario = auth()->user();
            $usuarioId = $usuario?->id;
            $accion = $this->obtenerAccion($request->getMethod());
            $tabla = $this->obtenerTabla($request->path());

            // Solo registrar si detecta una tabla válida
            if (!$tabla) {
                return;
            }

            // Intentar obtener ID del recurso
            $registroId = $this->obtenerRegistroId($request);

            Bitacora::create([
                'fecha_hora' => now(),
                'usuario_id' => $usuarioId,
                'accion' => $accion,
                'tabla_afectada' => $tabla,
                'registro_id' => $registroId,
                'datos_nuevos' => json_encode($request->except(['password', 'password_confirmation'])),
                'direccion_ip' => $request->ip(),
                'descripcion' => $this->generarDescripcion($accion, $tabla, $registroId)
            ]);
        } catch (\Exception $e) {
            // Silenciosamente fallar si hay error en auditoría
            \Log::debug('Error en auditoría: ' . $e->getMessage());
        }
    }

    /**
     * Obtener el tipo de acción del método HTTP
     */
    private function obtenerAccion(string $metodo): string
    {
        return match ($metodo) {
            'POST' => 'CREAR',
            'PUT', 'PATCH' => 'ACTUALIZAR',
            'DELETE' => 'ELIMINAR',
            default => 'MODIFICAR'
        };
    }

    /**
     * Extraer nombre de tabla del path
     */
    private function obtenerTabla(string $path): ?string
    {
        // Extractar la parte después de /api/
        $partes = explode('/', trim($path, '/'));
        
        if (count($partes) < 2) {
            return null;
        }

        $recurso = $partes[1];

        // Mapeo de recursos a tablas
        $mapeo = [
            'docentes' => 'docente',
            'materias' => 'materia',
            'aulas' => 'aula',
            'grupos' => 'grupo',
            'periodos' => 'periodo_academico',
            'bloques-horarios' => 'bloque_horario',
            'roles' => 'rol',
            'usuarios' => 'usuario',
            'horarios' => 'horario_asignado',
            'asistencias' => 'asistencia',
        ];

        return $mapeo[$recurso] ?? null;
    }

    /**
     * Obtener ID del registro de la ruta
     */
    private function obtenerRegistroId(Request $request): ?int
    {
        $partes = explode('/', trim($request->path(), '/'));
        
        // El ID generalmente es el tercer segmento (después de /api/recurso/)
        if (count($partes) >= 3 && is_numeric($partes[2])) {
            return (int) $partes[2];
        }

        return null;
    }

    /**
     * Generar descripción de auditoría
     */
    private function generarDescripcion(string $accion, string $tabla, ?int $registroId): string
    {
        $desc = ucfirst(strtolower($accion)) . " en tabla: $tabla";
        
        if ($registroId) {
            $desc .= " (ID: $registroId)";
        }

        return $desc;
    }
}