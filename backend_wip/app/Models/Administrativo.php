<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Administrativo extends Model
{
    protected $table = 'administrativo';
    protected $primaryKey = 'persona_id';
    public $incrementing = false;
    protected $fillable = ['persona_id', 'cargo', 'area_administrativa_id', 'created_by', 'updated_by'];
    public $timestamps = true;

    public function persona()
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function areaAdministrativa()
    {
        return $this->belongsTo(AreaAdministrativa::class, 'area_administrativa_id');
    }
}