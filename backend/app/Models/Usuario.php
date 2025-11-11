<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'usuario';
    protected $fillable = ['nombre_completo', 'email', 'password_hash', 'activo', 'created_by', 'updated_by'];
    protected $hidden = ['password_hash'];
    public $timestamps = true;

    public function getAuthPassword(): string
    {
        return (string) $this->password_hash;
    }

    public function persona()
    {
        return $this->hasOne(Persona::class, 'usuario_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'usuario_rol');
    }
}
