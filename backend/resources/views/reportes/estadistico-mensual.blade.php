<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte mensual estatico</title>
    <style>
        body {
            font-family: 'Inter', Arial, sans-serif;
            color: #111827;
            margin: 24px;
            background: #fff;
        }
        .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 24px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #111827;
        }
        .header span {
            display: block;
            font-size: 12px;
            color: #6b7280;
        }
        .period {
            margin-top: 4px;
            font-size: 12px;
            color: #374151;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .card {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 16px;
            background: #f9fafb;
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }
        .card .title {
            font-size: 12px;
            color: #6b7280;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .card .value {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin-top: 8px;
        }
        .details {
            margin-top: 24px;
        }
        .details h2 {
            font-size: 16px;
            margin-bottom: 12px;
        }
        .details table {
            width: 100%;
            border-collapse: collapse;
        }
        .details th,
        .details td {
            padding: 8px;
            border: 1px solid #e5e7eb;
            font-size: 12px;
            text-align: left;
        }
        .free-aulas {
            margin-bottom: 24px;
        }
        .free-aulas h2 {
            font-size: 16px;
            margin-bottom: 8px;
        }
        .chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .chip {
            padding: 6px 10px;
            border-radius: 999px;
            background: #f3f4f6;
            font-size: 12px;
            color: #111827;
            border: 1px solid #e5e7eb;
        }
        .empty-note {
            font-size: 12px;
            color: #6b7280;
        }
        .footer {
            margin-top: 32px;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte mensual estatico</h1>
        <span>Periodo generado automaticamente</span>
        <span class="period">Mes: {{ $datos['periodo']['nombre'] }} ({{ $datos['periodo']['inicio'] }} - {{ $datos['periodo']['fin'] }})</span>
        <span class="period">Generado el {{ $fecha_generacion }}</span>
        <span class="period">Actualizado a las {{ $datos['hora_actual'] }}</span>
    </div>

    <div class="grid">
        <div class="card">
            <div class="title">Docentes activos</div>
            <div class="value">{{ $datos['docentes_activos'] }}</div>
        </div>
        <div class="card">
            <div class="title">Aulas ocupadas ahora</div>
            <div class="value">{{ $datos['aulas_ocupadas'] }}</div>
        </div>
        <div class="card">
            <div class="title">Aulas libres ahora</div>
            <div class="value">{{ $datos['aulas_libres'] }}</div>
        </div>
        <div class="card">
            <div class="title">Porcentaje asistencia</div>
            <div class="value">{{ $datos['porcentaje_asistencia'] }}%</div>
        </div>
    </div>

    <div class="free-aulas">
        <h2>Aulas libres ahora</h2>
        @if(!empty($datos['aulas_libres_detalles']))
            <div class="chips">
                @foreach($datos['aulas_libres_detalles'] as $aula)
                    <span class="chip">
                        {{ $aula['codigo_aula'] }}
                        @if(!empty($aula['ubicacion']))
                            · {{ $aula['ubicacion'] }}
                        @endif
                        @if(!empty($aula['piso']))
                            (Piso {{ $aula['piso'] }})
                        @endif
                    </span>
                @endforeach
            </div>
        @else
            <p class="empty-note">No hay aulas libres ocupables en este momento.</p>
        @endif
    </div>

    <div class="details">
        <h2>Detalle mensual</h2>
        <table>
            <thead>
                <tr>
                    <th>Metrica</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total asistencias registradas</td>
                    <td>{{ $datos['total_asistencias'] }}</td>
                </tr>
                <tr>
                    <td>Asistencias marcadas como presente</td>
                    <td>{{ $datos['presentes'] }}</td>
                </tr>
                <tr>
                    <td>Total aulas</td>
                    <td>{{ $datos['aulas_totales'] }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Sistema de Gestion Academica</p>
        <p>Reporte estatico mensual generado automaticamente</p>
    </div>
</body>
</html>
