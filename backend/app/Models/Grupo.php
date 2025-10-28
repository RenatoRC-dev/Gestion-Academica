<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grupo extends Model
{
    protected $table = 'grupo';
    protected $fillable = ['materia_id', 'periodo_academico_id', 'codigo_grupo', 'cupo_maximo', 'cupo_minimo', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function materia()
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }

    public function periodo()
    {
        return $this->belongsTo(PeriodoAcademico::class, 'periodo_academico_id');
    }

    public function horariosAsignados()
    {
        return $this->hasMany(HorarioAsignado::class, 'grupo_id');
    }
}