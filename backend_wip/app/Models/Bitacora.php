<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bitacora extends Model
{
    protected $table = 'bitacora';
    protected $fillable = ['fecha_hora', 'usuario_id', 'accion', 'tabla_afectada', 'registro_id', 'datos_anteriores', 'datos_nuevos', 'direccion_ip', 'descripcion'];
    protected $casts = ['fecha_hora' => 'datetime', 'datos_anteriores' => 'json', 'datos_nuevos' => 'json'];
    public $timestamps = false;

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}