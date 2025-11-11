<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Asistencia</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 10px;
        }
        .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 20px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .estadisticas {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            background-color: #F3F4F6;
            padding: 15px;
            border-radius: 5px;
        }
        .estadistica {
            text-align: center;
        }
        .estadistica .numero {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
        }
        .estadistica .label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #4F46E5;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9px;
        }
        td {
            border: 1px solid #ddd;
            padding: 6px;
            font-size: 8px;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Asistencia Docente</h1>
        <p>Generado el: {{ $fecha_generacion }}</p>
        @if(!empty($filtros['fecha_inicio']) && !empty($filtros['fecha_fin']))
            <p>Periodo: {{ $filtros['fecha_inicio'] }} - {{ $filtros['fecha_fin'] }}</p>
        @endif
    </div>

    <div class="estadisticas">
        <div class="estadistica">
            <div class="numero">{{ $estadisticas['total_clases'] }}</div>
            <div class="label">Total Clases</div>
        </div>
        <div class="estadistica">
            <div class="numero">{{ $estadisticas['presentes'] }}</div>
            <div class="label">Presentes</div>
        </div>
        <div class="estadistica">
            <div class="numero">{{ $estadisticas['faltas'] }}</div>
            <div class="label">Faltas</div>
        </div>
        <div class="estadistica">
            <div class="numero">{{ $estadisticas['porcentaje_asistencia'] }}%</div>
            <div class="label">% Asistencia</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Docente</th>
                <th>Materia</th>
                <th>Grupo</th>
                <th>Día</th>
                <th>Horario</th>
                <th>Estado</th>
                <th>Método</th>
            </tr>
        </thead>
        <tbody>
            @foreach($registros as $registro)
            <tr>
                <td>{{ $registro['Fecha'] }}</td>
                <td>{{ $registro['Docente'] }}</td>
                <td>{{ $registro['Materia'] }}</td>
                <td>{{ $registro['Grupo'] }}</td>
                <td>{{ $registro['Día'] }}</td>
                <td>{{ $registro['Horario'] }}</td>
                <td>{{ $registro['Estado'] }}</td>
                <td>{{ $registro['Método'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Sistema de Gestión Académica - Reporte de Asistencia</p>
        <p>Este documento fue generado automáticamente</p>
    </div>
</body>
</html>
