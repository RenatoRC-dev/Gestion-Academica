<?php

namespace App\Services;

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
                    switch ($tipoImportacion) {
                        case 'docentes':
                            $this->importarDocente($fila);
                            break;
                        case 'estudiantes':
                            $this->importarEstudiante($fila);
                            break;
                        case 'usuarios':
                            $this->importarUsuario($fila);
                            break;
                        default:
                            throw new \Exception("Tipo de importación no válido");
                    }

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
            throw $e;
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
                    $validado = $this->validarFila($tipoImportacion, $fila);
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
        $reglas = $this->obtenerReglasValidacion($tipo);

        $datos = [];
        foreach ($reglas['campos'] as $key => $campo) {
            $datos[$campo] = $fila[$key] ?? null;
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

        // Crear Usuario
        $usuario = Usuario::create([
            'email' => $validado['email'],
            'password' => Hash::make($validado['password'] ?? 'temporal123'),
            'activo' => true,
        ]);

        // Crear Persona
        $persona = Persona::create([
            'nombre' => $validado['nombre'],
            'apellido_paterno' => $validado['apellido_paterno'],
            'apellido_materno' => $validado['apellido_materno'] ?? null,
            'ci' => $validado['ci'],
            'email' => $validado['email'],
            'telefono' => $validado['telefono'] ?? null,
            'usuario_id' => $usuario->id,
        ]);

        // Crear Docente
        Docente::create([
            'persona_id' => $persona->id,
            'especialidad' => $validado['especialidad'] ?? null,
            'grado_academico' => $validado['grado_academico'] ?? null,
        ]);

        // Asignar rol de docente
        $rolDocente = Rol::where('nombre', 'docente')->first();
        if ($rolDocente) {
            $usuario->roles()->attach($rolDocente->id);
        }
    }

    /**
     * Importar un estudiante
     */
    private function importarEstudiante(Collection $fila): void
    {
        $validado = $this->validarFila('estudiantes', $fila);

        $usuarioExiste = Usuario::where('email', $validado['email'])->exists();
        if ($usuarioExiste) {
            throw new \Exception("El email {$validado['email']} ya está registrado");
        }

        $usuario = Usuario::create([
            'email' => $validado['email'],
            'password' => Hash::make($validado['password'] ?? 'temporal123'),
            'activo' => true,
        ]);

        $persona = Persona::create([
            'nombre' => $validado['nombre'],
            'apellido_paterno' => $validado['apellido_paterno'],
            'apellido_materno' => $validado['apellido_materno'] ?? null,
            'ci' => $validado['ci'],
            'email' => $validado['email'],
            'telefono' => $validado['telefono'] ?? null,
            'usuario_id' => $usuario->id,
        ]);

        Estudiante::create([
            'persona_id' => $persona->id,
            'codigo_estudiante' => $validado['codigo_estudiante'] ?? null,
        ]);

        $rolEstudiante = Rol::where('nombre', 'estudiante')->first();
        if ($rolEstudiante) {
            $usuario->roles()->attach($rolEstudiante->id);
        }
    }

    /**
     * Importar un usuario genérico
     */
    private function importarUsuario(Collection $fila): void
    {
        $validado = $this->validarFila('usuarios', $fila);

        $usuarioExiste = Usuario::where('email', $validado['email'])->exists();
        if ($usuarioExiste) {
            throw new \Exception("El email {$validado['email']} ya está registrado");
        }

        $usuario = Usuario::create([
            'email' => $validado['email'],
            'password' => Hash::make($validado['password'] ?? 'temporal123'),
            'activo' => true,
        ]);

        Persona::create([
            'nombre' => $validado['nombre'],
            'apellido_paterno' => $validado['apellido_paterno'],
            'apellido_materno' => $validado['apellido_materno'] ?? null,
            'ci' => $validado['ci'],
            'email' => $validado['email'],
            'telefono' => $validado['telefono'] ?? null,
            'usuario_id' => $usuario->id,
        ]);

        // Asignar rol si se especifica
        if (!empty($validado['rol'])) {
            $rol = Rol::where('nombre', $validado['rol'])->first();
            if ($rol) {
                $usuario->roles()->attach($rol->id);
            }
        }
    }

    /**
     * Obtener reglas de validación según tipo
     */
    private function obtenerReglasValidacion(string $tipo): array
    {
        switch ($tipo) {
            case 'docentes':
                return [
                    'campos' => ['nombre', 'apellido_paterno', 'apellido_materno', 'ci', 'email', 'telefono', 'especialidad', 'grado_academico'],
                    'validaciones' => [
                        'nombre' => 'required|string|max:100',
                        'apellido_paterno' => 'required|string|max:100',
                        'apellido_materno' => 'nullable|string|max:100',
                        'ci' => 'required|string|max:20',
                        'email' => 'required|email|max:150',
                        'telefono' => 'nullable|string|max:20',
                        'especialidad' => 'nullable|string|max:150',
                        'grado_academico' => 'nullable|string|max:100',
                    ],
                    'mensajes' => [
                        'nombre.required' => 'El nombre es requerido',
                        'apellido_paterno.required' => 'El apellido paterno es requerido',
                        'ci.required' => 'El CI es requerido',
                        'email.required' => 'El email es requerido',
                        'email.email' => 'El email debe ser válido',
                    ]
                ];

            case 'estudiantes':
                return [
                    'campos' => ['nombre', 'apellido_paterno', 'apellido_materno', 'ci', 'email', 'telefono', 'codigo_estudiante'],
                    'validaciones' => [
                        'nombre' => 'required|string|max:100',
                        'apellido_paterno' => 'required|string|max:100',
                        'apellido_materno' => 'nullable|string|max:100',
                        'ci' => 'required|string|max:20',
                        'email' => 'required|email|max:150',
                        'telefono' => 'nullable|string|max:20',
                        'codigo_estudiante' => 'nullable|string|max:50',
                    ],
                    'mensajes' => [
                        'nombre.required' => 'El nombre es requerido',
                        'apellido_paterno.required' => 'El apellido paterno es requerido',
                        'ci.required' => 'El CI es requerido',
                        'email.required' => 'El email es requerido',
                        'email.email' => 'El email debe ser válido',
                    ]
                ];

            case 'usuarios':
                return [
                    'campos' => ['nombre', 'apellido_paterno', 'apellido_materno', 'ci', 'email', 'telefono', 'rol'],
                    'validaciones' => [
                        'nombre' => 'required|string|max:100',
                        'apellido_paterno' => 'required|string|max:100',
                        'apellido_materno' => 'nullable|string|max:100',
                        'ci' => 'required|string|max:20',
                        'email' => 'required|email|max:150',
                        'telefono' => 'nullable|string|max:20',
                        'rol' => 'nullable|string|max:50',
                    ],
                    'mensajes' => [
                        'nombre.required' => 'El nombre es requerido',
                        'apellido_paterno.required' => 'El apellido paterno es requerido',
                        'ci.required' => 'El CI es requerido',
                        'email.required' => 'El email es requerido',
                        'email.email' => 'El email debe ser válido',
                    ]
                ];

            default:
                throw new \Exception("Tipo de importación no soportado");
        }
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
