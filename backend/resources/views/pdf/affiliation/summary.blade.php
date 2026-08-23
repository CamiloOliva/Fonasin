<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        body {
            color: #111827;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.45;
        }

        h1 {
            color: #065f46;
            font-size: 20px;
            margin: 0 0 4px;
            text-align: center;
            text-transform: uppercase;
        }

        h2 {
            border-bottom: 1px solid #d1d5db;
            color: #047857;
            font-size: 14px;
            margin: 20px 0 8px;
            padding-bottom: 4px;
            text-transform: uppercase;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        th,
        td {
            border: 1px solid #d1d5db;
            padding: 6px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #ecfdf5;
            width: 34%;
        }

        .meta {
            color: #4b5563;
            margin-bottom: 18px;
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>Resumen de afiliacion FONASIN</h1>
    <p class="meta">Solicitud {{ $application->id }} generada el {{ now('America/Bogota')->format('Y-m-d H:i') }}</p>

    @foreach ($sections as $section => $payload)
        <h2>{{ str_replace('_', ' ', $section) }}</h2>

        @if ($section === 'beneficiaries')
            <table>
                <tr>
                    <th>Beneficiarios</th>
                    <td>
                        @foreach (($payload['beneficiaries'] ?? []) as $beneficiary)
                            <p>
                                {{ $beneficiary['fullName'] ?? '' }}
                                - {{ $beneficiary['relationship'] ?? '' }}
                                - {{ $beneficiary['percentage'] ?? '' }}%
                            </p>
                        @endforeach
                    </td>
                </tr>
                <tr>
                    <th>Contacto de emergencia</th>
                    <td>
                        {{ $payload['emergencyContact']['fullName'] ?? '' }}
                        - {{ $payload['emergencyContact']['relationship'] ?? '' }}
                        - {{ $payload['emergencyContact']['phone'] ?? '' }}
                    </td>
                </tr>
            </table>
        @else
            <table>
                @foreach ($payload as $key => $value)
                    <tr>
                        <th>{{ str_replace('_', ' ', preg_replace('/(?<!^)[A-Z]/', ' $0', $key)) }}</th>
                        <td>
                            @if (is_array($value))
                                {{ implode(', ', array_filter($value, fn ($item) => is_scalar($item))) }}
                            @else
                                {{ $value }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            </table>
        @endif
    @endforeach
</body>
</html>
