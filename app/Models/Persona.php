<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Persona extends Model
{
    protected $table = 'persona';
    protected $fillable = ['usuario_id', 'nombre_completo', 'ci', 'telefono_contacto', 'direccion', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function docente()
    {
        return $this->hasOne(Docente::class, 'persona_id');
    }

    public function administrativo()
    {
        return $this->hasOne(Administrativo::class, 'persona_id');
    }
}