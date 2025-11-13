<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PlantillaDocentesExport implements FromCollection, WithHeadings
{
    public function collection(): Collection
    {
        return collect([]);
    }

    public function headings(): array
    {
        return [
            'nombre_completo',
            'ci',
            'codigo_docente',
            'telefono',
            'direccion',
            'email',
        ];
    }
}
