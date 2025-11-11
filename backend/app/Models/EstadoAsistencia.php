<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoAsistencia extends Model
{
    protected $table = 'estado_asistencia';
    protected $fillable = [
        'nombre',
        'descripcion',
        'cuenta_como_falta',
        'orden',
        'activo',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'cuenta_como_falta' => 'boolean',
        'activo' => 'boolean',
        'orden' => 'integer',
    ];

    public $timestamps = true;

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'estado_id');
    }
}
