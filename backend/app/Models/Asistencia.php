<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    protected $table = 'asistencia';
    protected $fillable = ['horario_asignado_id', 'docente_id', 'fecha_hora_registro', 'estado_id', 'metodo_registro_id', 'codigo_qr_id', 'observaciones', 'registrado_por_id', 'created_by', 'updated_by'];
    protected $casts = ['fecha_hora_registro' => 'datetime'];
    public $timestamps = true;

    public function horarioAsignado()
    {
        return $this->belongsTo(HorarioAsignado::class, 'horario_asignado_id');
    }

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'docente_id', 'persona_id');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoAsistencia::class, 'estado_id');
    }

    public function metodoRegistro()
    {
        return $this->belongsTo(MetodoRegistroAsistencia::class, 'metodo_registro_id');
    }

    public function codigoQR()
    {
        return $this->belongsTo(CodigoQRAsistencia::class, 'codigo_qr_id');
    }

    public function registradoPor()
    {
        return $this->belongsTo(Usuario::class, 'registrado_por_id');
    }
}