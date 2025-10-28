<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Docente extends Model
{
    protected $table = 'docente';
    protected $primaryKey = 'persona_id';
    public $incrementing = false;
    protected $fillable = ['persona_id', 'codigo_docente', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function persona()
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function areas()
    {
        return $this->belongsToMany(AreaAcademica::class, 'docente_area', 'docente_persona_id', 'area_academica_id');
    }

    public function horariosAsignados()
    {
        return $this->hasMany(HorarioAsignado::class, 'docente_id', 'persona_id');
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'docente_id', 'persona_id');
    }
}