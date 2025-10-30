<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    protected $table = 'horario';
    protected $fillable = ['hora_inicio', 'hora_fin', 'descripcion'];
    protected $casts = [
        'hora_inicio' => 'string',
        'hora_fin' => 'string'
    ];
    public $timestamps = true;

    public function bloques()
    {
        return $this->hasMany(BloqueHorario::class, 'horario_id');
    }
}