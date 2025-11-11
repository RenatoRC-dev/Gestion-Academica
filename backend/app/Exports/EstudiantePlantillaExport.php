<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EstudiantePlantillaExport implements FromArray, WithHeadings, WithStyles, WithTitle
{
    public function array(): array
    {
        return [
            ['Carlos', 'Sánchez', 'Flores', '11223344', 'carlos.sanchez@estudiante.com', '76666666', 'EST2024001'],
            ['Ana', 'Martínez', 'Vargas', '44332211', 'ana.martinez@estudiante.com', '75555555', 'EST2024002'],
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
            'Código Estudiante',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '10B981']
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Plantilla Estudiantes';
    }
}
