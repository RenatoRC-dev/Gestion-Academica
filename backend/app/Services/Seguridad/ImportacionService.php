<?php

namespace App\Services\Seguridad;

use App\Models\Usuario;
use App\Models\Persona;
use App\Models\Docente;
use App\Models\Estudiante;
use App\Models\Rol;
use App\Models\ImportacionLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Collection;

class ImportacionService
{
    /**
     * Procesar archivo Excel/CSV de usuarios
     */
    public function procesarArchivo(string $tipoImportacion, string $rutaArchivo, int $importadoPorId): array
    {
        try {
            // Leer archivo Excel
            $data = Excel::toCollection(null, $rutaArchivo)->first();

            // Quitar la fila de encabezados
            $encabezados = $data->shift();

            $totalRegistros = $data->count();
            $exitosos = 0;
            $fallidos = 0;
            $errores = [];

            DB::beginTransaction();

        foreach ($data as $index => $fila) {
            $numeroFila = $index + 2; // +2 porque Excel empieza en 1 y ya quitamos el encabezado

            try {
                // Validar y procesar según tipo
                if ($tipoImportacion !== 'docentes') {
                    throw new \Exception("Tipo de importación no soportado");
                }
                $this->importarDocente($fila);

                $exitosos++;
            } catch (\Exception $e) {
                    $fallidos++;
                    $errores[] = [
                        'fila' => $numeroFila,
                        'error' => $e->getMessage(),
                        'datos' => $fila->toArray()
                    ];
                }
            }

            // Registrar en log
            $log = ImportacionLog::create([
                'tipo_importacion' => $tipoImportacion,
                'archivo_original' => basename($rutaArchivo),
                'total_registros' => $totalRegistros,
                'exitosos' => $exitosos,
                'fallidos' => $fallidos,
                'errores_detalle' => $errores,
                'importado_por_id' => $importadoPorId,
            ]);

            DB::commit();

            return [
                'success' => true,
                'log' => $log,
                'mensaje' => "Importación completada: {$exitosos} exitosos, {$fallidos} fallidos de {$totalRegistros} registros"
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Falló importación masiva', [
                'mensaje' => $e->getMessage(),
                'archivo' => basename($rutaArchivo),
                'errores' => $errores,
                'tipo' => $tipoImportacion,
            ]);
            throw new \Exception('No se pudo registrar la importación: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Validar archivo antes de procesarlo (vista previa)
     */
    public function validarArchivo(string $tipoImportacion, string $rutaArchivo): array
    {
        try {
            $data = Excel::toCollection(null, $rutaArchivo)->first();
            $encabezados = $data->shift();

            $errores = [];
            $preview = [];
            $maxPreview = 10; // Mostrar primeras 10 filas

            foreach ($data->take($maxPreview) as $index => $fila) {
                $numeroFila = $index + 2;

                try {
                    $validado = $this->validarFila('docentes', $fila);
                    $preview[] = [
                        'fila' => $numeroFila,
                        'datos' => $fila->toArray(),
                        'valido' => true
                    ];
                } catch (\Exception $e) {
                    $preview[] = [
                        'fila' => $numeroFila,
                        'datos' => $fila->toArray(),
                        'valido' => false,
                        'error' => $e->getMessage()
                    ];
                    $errores[] = [
                        'fila' => $numeroFila,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return [
                'success' => true,
                'total_registros' => $data->count(),
                'encabezados' => $encabezados->toArray(),
                'preview' => $preview,
                'errores_preview' => $errores,
                'tiene_errores' => count($errores) > 0
            ];
        } catch (\Exception $e) {
            throw new \Exception("Error al leer el archivo: " . $e->getMessage());
        }
    }

    /**
     * Validar una fila según el tipo
     */
    private function validarFila(string $tipo, Collection $fila): array
    {
        if ($tipo !== 'docentes') {
            throw new \Exception("Tipo no soportado");
        }
        $reglas = $this->obtenerReglasValidacion($tipo);

        $datos = [];
        foreach ($reglas['campos'] as $key => $campo) {
            $valor = $fila[$key] ?? '';
            if (in_array($campo, ['ci', 'telefono', 'codigo_docente'], true)) {
                $valor = (string) $valor;
            }
            $datos[$campo] = $valor;
        }

        $validator = Validator::make($datos, $reglas['validaciones'], $reglas['mensajes'] ?? []);

        if ($validator->fails()) {
            throw new \Exception(implode(', ', $validator->errors()->all()));
        }

        return $validator->validated();
    }

    /**
     * Importar un docente
     */
    private function importarDocente(Collection $fila): void
    {
        $validado = $this->validarFila('docentes', $fila);

        // Verificar si el usuario ya existe
        $usuarioExiste = Usuario::where('email', $validado['email'])->exists();
        if ($usuarioExiste) {
            throw new \Exception("El email {$validado['email']} ya está registrado");
        }

        $usuario = Usuario::create([
            'nombre_completo' => $validado['nombre_completo'],
            'email' => $validado['email'],
            'password_hash' => Hash::make($validado['ci']),
            'activo' => true,
        ]);

        $persona = Persona::create([
            'nombre_completo' => $validado['nombre_completo'],
            'ci' => $validado['ci'],
            'telefono_contacto' => $validado['telefono'] ?? null,
            'direccion' => $validado['direccion'] ?? null,
            'email' => $validado['email'],
            'usuario_id' => $usuario->id,
        ]);

        Docente::create([
            'persona_id' => $persona->id,
            'codigo_docente' => $validado['codigo_docente'],
        ]);

        // Asignar rol de docente
        $rolDocente = Rol::where('nombre', 'docente')->first();
        if ($rolDocente) {
            $usuario->roles()->attach($rolDocente->id);
        }
    }

    /**
     * Obtener reglas de validación según tipo
     */
    private function obtenerReglasValidacion(string $tipo): array
    {
        return [
            'campos' => ['nombre_completo', 'ci', 'codigo_docente', 'telefono', 'direccion', 'email'],
            'validaciones' => [
                'nombre_completo' => 'required|string|max:150',
                'ci' => 'required|string|max:20',
                'codigo_docente' => 'required|string|max:50',
                'telefono' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:255',
                'email' => 'required|email|max:150',
            ],
            'mensajes' => [
                'nombre_completo.required' => 'El nombre completo es requerido',
                'ci.required' => 'El CI es requerido',
                'codigo_docente.required' => 'El código de docente es requerido',
                'email.required' => 'El email es requerido',
                'email.email' => 'El email debe ser válido',
            ]
        ];
    }

    /**
     * Obtener historial de importaciones
     */
    public function obtenerHistorial(array $filtros = []): Collection
    {
        $query = ImportacionLog::with('importadoPor')->orderBy('fecha_importacion', 'desc');

        if (!empty($filtros['tipo_importacion'])) {
            $query->where('tipo_importacion', $filtros['tipo_importacion']);
        }

        return $query->get();
    }
}
