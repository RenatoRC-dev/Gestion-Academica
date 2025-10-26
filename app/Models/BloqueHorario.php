<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BloqueHorario extends Model
{
    protected $table = 'bloque_horario';
    protected $fillable = ['dia_id', 'horario_id', 'activo', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function dia()
    {
        return $this->belongsTo(Dia::class, 'dia_id');
    }

    public function horario()
    {
        return $this->belongsTo(Horario::class, 'horario_id');
    }

    public function horariosAsignados()
    {
        return $this->hasMany(HorarioAsignado::class, 'bloque_horario_id');
    }
}