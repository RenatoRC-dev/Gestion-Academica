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
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Solo registrar en bitácora operaciones que modifiquen datos
        if ($this->debeRegistrarse($request)) {
            $this->registrarEnBitacora($request, $response);
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
    private function registrarEnBitacora(Request $request, Response $response): void
    {
        try {
            $usuario = auth()->user();
            $usuarioId = $usuario ? $usuario->id : null;

            // Determinar tabla afectada del endpoint
            $path = $request->getPathInfo();
            $tablaAfectada = $this->extraerTabla($path);
            $registroId = $this->extraerRegistroId($path);

            // Obtener datos del request
            $datosNuevos = $request->getMethod() !== 'DELETE' ? $request->all() : null;

            Bitacora::create([
                'usuario_id' => $usuarioId,
                'accion' => $request->getMethod(), // POST, PUT, DELETE
                'tabla_afectada' => $tablaAfectada,
                'registro_id' => $registroId,
                'datos_anteriores' => null, // Podría implementarse comparación
                'datos_nuevos' => $datosNuevos ? json_encode($datosNuevos) : null,
                'direccion_ip' => $request->ip(),
                'descripcion' => $this->generarDescripcion($request, $response),
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
    private function generarDescripcion(Request $request, Response $response): string
    {
        $metodo = $request->getMethod();
        $path = $request->getPathInfo();
        $codigo = $response->getStatusCode();

        return "{$metodo} {$path} - HTTP {$codigo}";
    }
}