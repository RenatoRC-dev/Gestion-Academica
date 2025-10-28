<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Model
{
    use HasApiTokens;

    protected $table = 'usuario';
    protected $fillable = ['nombre_completo', 'email', 'password_hash', 'activo', 'created_by', 'updated_by'];
    protected $hidden = ['password_hash'];
    public $timestamps = true;

    public function persona()
    {
        return $this->hasOne(Persona::class, 'usuario_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'usuario_rol');
    }
}