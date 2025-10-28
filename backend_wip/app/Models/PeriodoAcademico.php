<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodoAcademico extends Model
{
    protected $table = 'periodo_academico';
    protected $fillable = ['nombre', 'fecha_inicio', 'fecha_fin', 'activo', 'created_by', 'updated_by'];
    protected $casts = ['fecha_inicio' => 'date', 'fecha_fin' => 'date'];
    public $timestamps = true;

    public function grupos()
    {
        return $this->hasMany(Grupo::class, 'periodo_academico_id');
    }

    public function horariosAsignados()
    {
        return $this->hasMany(HorarioAsignado::class, 'periodo_academico_id');
    }
}