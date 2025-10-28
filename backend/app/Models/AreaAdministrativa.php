<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AreaAdministrativa extends Model
{
    protected $table = 'area_administrativa';
    protected $fillable = ['nombre', 'descripcion', 'activo', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function administrativos()
    {
        return $this->hasMany(Administrativo::class, 'area_administrativa_id');
    }
}