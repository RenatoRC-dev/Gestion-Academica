<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HorarioAsignado extends Model
{
    protected $table = 'horario_asignado';
    protected $fillable = ['grupo_id', 'docente_id', 'aula_id', 'bloque_horario_id', 'periodo_academico_id', 'modalidad_id', 'fecha_especifica', 'created_by', 'updated_by'];
    protected $casts = ['fecha_especifica' => 'date'];
    public $timestamps = true;

    public function grupo()
    {
        return $this->belongsTo(Grupo::class, 'grupo_id');
    }

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'docente_id', 'persona_id');
    }

    public function aula()
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function bloqueHorario()
    {
        return $this->belongsTo(BloqueHorario::class, 'bloque_horario_id');
    }

    public function periodo()
    {
        return $this->belongsTo(PeriodoAcademico::class, 'periodo_academico_id');
    }

    public function modalidad()
    {
        return $this->belongsTo(ModalidadClase::class, 'modalidad_id');
    }

    public function codigosQR()
    {
        return $this->hasMany(CodigoQRAsistencia::class, 'horario_asignado_id');
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'horario_asignado_id');
    }
}