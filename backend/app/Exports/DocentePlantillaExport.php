<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DocentePlantillaExport implements FromArray, WithHeadings, WithStyles, WithTitle
{
    public function array(): array
    {
        // Datos de ejemplo
        return [
            ['Juan', 'Pérez', 'García', '12345678', 'juan.perez@ejemplo.com', '77777777', 'Ingeniería de Sistemas', 'Magíster'],
            ['María', 'López', 'Rodríguez', '87654321', 'maria.lopez@ejemplo.com', '78888888', 'Matemáticas', 'Licenciada'],
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
            'Especialidad',
            'Grado Académico',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5']
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Plantilla Docentes';
    }
}
