<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    protected $table = 'horario';
    protected $fillable = ['hora_inicio', 'hora_fin', 'descripcion'];
    public $timestamps = true;

    public function bloquesHorarios()
    {
        return $this->hasMany(BloqueHorario::class, 'horario_id');
    }
}