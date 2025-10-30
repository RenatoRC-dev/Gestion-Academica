<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aula extends Model
{
    protected $table = 'aula';
    protected $fillable = ['codigo_aula', 'capacidad', 'tipo_aula_id', 'ubicacion', 'equipamiento', 'es_virtual', 'activo', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function tipo()
    {
        return $this->belongsTo(TipoAula::class, 'tipo_aula_id');
    }

    public function horariosAsignados()
    {
        return $this->hasMany(HorarioAsignado::class, 'aula_id');
    }

    public function tipoAula()
    {
        return $this->belongsTo(\App\Models\TipoAula::class, 'tipo_aula_id');
    }
}