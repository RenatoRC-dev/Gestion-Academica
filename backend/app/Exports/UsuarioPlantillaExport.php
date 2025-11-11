<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class UsuarioPlantillaExport implements FromArray, WithHeadings, WithStyles, WithTitle
{
    public function array(): array
    {
        return [
            ['Roberto', 'Gómez', 'Silva', '55667788', 'roberto.gomez@ejemplo.com', '79999999', 'admin'],
            ['Laura', 'Fernández', 'Torres', '88776655', 'laura.fernandez@ejemplo.com', '74444444', 'autoridad'],
        ];
    }

    public function headings(): array
    {
        return [
            'Nombre',
            'Apellido Paterno',
            'Apellido Materno',
            'CI',
            'Email',
            'Teléfono',
            'Rol',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F59E0B']
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Plantilla Usuarios';
    }
}
