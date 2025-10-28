<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = 'rol';
    protected $fillable = ['nombre', 'descripcion'];
    public $timestamps = true;

    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'usuario_rol');
    }
}