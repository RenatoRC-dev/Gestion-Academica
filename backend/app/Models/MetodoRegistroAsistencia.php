<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetodoRegistroAsistencia extends Model
{
    protected $table = 'metodo_registro_asistencia';
    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public $timestamps = true;

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'metodo_registro_id');
    }
}