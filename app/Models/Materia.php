<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materia extends Model
{
    protected $table = 'materia';
    protected $fillable = ['codigo_materia', 'nombre', 'descripcion', 'activo', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function grupos()
    {
        return $this->hasMany(Grupo::class, 'materia_id');
    }
}