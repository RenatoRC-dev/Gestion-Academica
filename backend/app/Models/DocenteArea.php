<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class DocenteArea extends Pivot
{
    protected $table = 'docente_area';
    public $timestamps = false;
}