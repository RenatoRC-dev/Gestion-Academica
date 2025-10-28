<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AreaAcademica extends Model
{
    protected $table = 'area_academica';
    protected $fillable = ['nombre', 'descripcion', 'activo', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function docentes()
    {
        return $this->belongsToMany(Docente::class, 'docente_area', 'area_academica_id', 'docente_persona_id');
    }
}