<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AsistenciaExport implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $registros;
    protected $estadisticas;

    public function __construct(array $registros, array $estadisticas)
    {
        $this->registros = collect($registros);
        $this->estadisticas = $estadisticas;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->registros->map(function ($registro) {
            return [
                $registro['Fecha'],
                $registro['Docente'],
                $registro['Materia'],
                $registro['Grupo'],
                $registro['Día'],
                $registro['Horario'],
                $registro['Estado'],
                $registro['Método'],
                $registro['Observaciones'],
            ];
        });
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Fecha',
            'Docente',
            'Materia',
            'Grupo',
            'Día',
            'Horario',
            'Estado',
            'Método',
            'Observaciones',
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Estilo para la primera fila (encabezados)
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5']
                ],
                'font' => ['color' => ['rgb' => 'FFFFFF'], 'bold' => true],
            ],
        ];
    }

    /**
     * @return string
     */
    public function title(): string
    {
        return 'Reporte de Asistencia';
    }
}
