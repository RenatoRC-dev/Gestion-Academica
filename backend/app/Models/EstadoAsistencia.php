<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoAsistencia extends Model
{
    protected $table = 'estado_asistencia';
    protected $fillable = ['nombre', 'descripcion'];
    public $timestamps = true;

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'estado_id');
    }
}