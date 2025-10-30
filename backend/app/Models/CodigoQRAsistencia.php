<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CodigoQRAsistencia extends Model
{
    protected $table = 'codigo_qr_asistencia';
    protected $fillable = ['horario_asignado_id', 'codigo_hash', 'fecha_hora_generacion', 'fecha_hora_expiracion', 'utilizado', 'created_by', 'updated_by'];
    protected $casts = [
    'fecha_hora_generacion'  => 'datetime',
    'fecha_hora_expiracion'  => 'datetime',
    'utilizado'              => 'boolean',
    ];
    public $timestamps = true;

    public function horarioAsignado()
    {
        return $this->belongsTo(HorarioAsignado::class, 'horario_asignado_id');
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'codigo_qr_id');
    }
}