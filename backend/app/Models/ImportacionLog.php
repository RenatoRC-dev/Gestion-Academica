<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportacionLog extends Model
{
    protected $table = 'importacion_log';

    protected $fillable = [
        'tipo_importacion',
        'archivo_original',
        'total_registros',
        'exitosos',
        'fallidos',
        'errores_detalle',
        'importado_por_id',
        'fecha_importacion',
    ];

    protected $casts = [
        'errores_detalle' => 'array',
        'fecha_importacion' => 'datetime',
        'total_registros' => 'integer',
        'exitosos' => 'integer',
        'fallidos' => 'integer',
    ];

    /**
     * Relación con Usuario
     */
    public function importadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'importado_por_id');
    }
}
