<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dia extends Model
{
    protected $table = 'dia';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $fillable = ['id', 'nombre'];
    public $timestamps = false;

    public function bloquesHorarios()
    {
        return $this->hasMany(BloqueHorario::class, 'dia_id');
    }
}