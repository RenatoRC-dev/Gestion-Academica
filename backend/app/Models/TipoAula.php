<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoAula extends Model
{
    protected $table = 'tipo_aula';
    protected $fillable = ['nombre', 'descripcion', 'activo'];
    public $timestamps = true;

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function aulas()
    {
        return $this->hasMany(Aula::class, 'tipo_aula_id');
    }
}
