<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModalidadClase extends Model
{
    protected $table = 'modalidad_clase';
    protected $fillable = ['nombre', 'descripcion'];
    public $timestamps = true;

    public function horariosAsignados()
    {
        return $this->hasMany(HorarioAsignado::class, 'modalidad_id');
    }
}