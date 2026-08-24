<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 28px 32px;
        }

        body {
            color: #111827;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.42;
        }

        .header {
            border-bottom: 4px solid #047857;
            margin-bottom: 16px;
            padding-bottom: 10px;
        }

        .brand-table,
        .data-table,
        .beneficiary-table {
            border-collapse: collapse;
            width: 100%;
        }

        .brand-mark {
            background: #047857;
            border-radius: 999px;
            color: #ffffff;
            font-size: 18px;
            font-weight: bold;
            height: 48px;
            text-align: center;
            width: 48px;
        }

        .brand-title {
            color: #064e3b;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: .08em;
            margin: 0;
            text-transform: uppercase;
        }

        .brand-subtitle {
            color: #374151;
            font-size: 10px;
            margin: 2px 0 0;
            text-transform: uppercase;
        }

        .meta-box {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #064e3b;
            font-size: 10px;
            padding: 6px 8px;
            text-align: right;
        }

        h1 {
            color: #064e3b;
            font-size: 18px;
            margin: 12px 0 4px;
            text-align: center;
            text-transform: uppercase;
        }

        .intro {
            color: #4b5563;
            margin: 0 0 14px;
            text-align: center;
        }

        .section {
            border: 1px solid #d1d5db;
            margin-top: 12px;
            page-break-inside: avoid;
        }

        .section-title {
            background: #047857;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: .08em;
            padding: 7px 9px;
            text-transform: uppercase;
        }

        .section-title.gold {
            background: #b45309;
        }

        .data-table th,
        .data-table td,
        .beneficiary-table th,
        .beneficiary-table td {
            border: 1px solid #e5e7eb;
            padding: 6px 7px;
            text-align: left;
            vertical-align: top;
        }

        .data-table th {
            background: #f8fafc;
            color: #374151;
            font-size: 9px;
            text-transform: uppercase;
            width: 30%;
        }

        .data-table td {
            color: #111827;
            width: 70%;
        }

        .beneficiary-table th {
            background: #ecfdf5;
            color: #065f46;
            font-size: 9px;
            text-transform: uppercase;
        }

        .muted {
            color: #6b7280;
        }

        .notice {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            color: #78350f;
            margin-top: 12px;
            padding: 8px 10px;
        }

        .footer {
            border-top: 1px solid #d1d5db;
            color: #6b7280;
            font-size: 9px;
            margin-top: 18px;
            padding-top: 8px;
            text-align: center;
        }
    </style>
</head>
<body>
@php
    $personal = $sections['personal'] ?? [];
    $employment = $sections['employment'] ?? [];
    $financial = $sections['financial'] ?? [];
    $beneficiariesPayload = $sections['beneficiaries'] ?? [];
    $sarlaft = $sections['sarlaft'] ?? [];

    $value = static fn (array $payload, string $key, string $fallback = 'No registra'): string => filled($payload[$key] ?? null)
        ? (string) $payload[$key]
        : $fallback;

    $money = static function (array $payload, string $key): string {
        $raw = $payload[$key] ?? null;

        if ($raw === null || $raw === '') {
            return 'No registra';
        }

        return '$ '.number_format((float) preg_replace('/[^\d.]/', '', (string) $raw), 0, ',', '.');
    };

    $list = static function (mixed $items): string {
        if (! is_array($items)) {
            return filled($items) ? (string) $items : 'No registra';
        }

        $filtered = array_values(array_filter($items, fn ($item): bool => is_scalar($item) && filled($item)));

        return $filtered === [] ? 'No registra' : implode(', ', $filtered);
    };

    $fullName = trim(implode(' ', array_filter([
        $personal['firstName'] ?? null,
        $personal['middleName'] ?? null,
        $personal['lastName'] ?? null,
        $personal['secondLastName'] ?? null,
    ], fn ($item): bool => filled($item))));

    $beneficiaries = array_values(array_filter(
        $beneficiariesPayload['beneficiaries'] ?? [],
        fn ($beneficiary): bool => is_array($beneficiary) && filled($beneficiary['fullName'] ?? null)
    ));
    $emergencyContact = $beneficiariesPayload['emergencyContact'] ?? [];
@endphp

    <div class="header">
        <table class="brand-table">
            <tr>
                <td style="width: 58px;">
                    <div class="brand-mark">F</div>
                </td>
                <td>
                    <p class="brand-title">FONASIN</p>
                    <p class="brand-subtitle">Fondo de Empleados del Sector Mineroenergetico</p>
                    <p class="brand-subtitle">NIT 900.861.038-8</p>
                </td>
                <td style="width: 210px;">
                    <div class="meta-box">
                        <strong>Solicitud</strong><br>
                        {{ $application->id }}<br>
                        <strong>Generada</strong><br>
                        {{ now('America/Bogota')->format('Y-m-d H:i') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <h1>Formulario de afiliacion</h1>
    <p class="intro">Registro completo de informacion suministrada para revision administrativa de FONASIN.</p>

    <div class="section">
        <div class="section-title">1. Datos personales y de contacto</div>
        <table class="data-table">
            <tr><th>Nombre completo</th><td>{{ $fullName !== '' ? $fullName : 'No registra' }}</td></tr>
            <tr><th>Documento</th><td>{{ $value($personal, 'documentType') }} {{ $value($personal, 'documentNumber', '') }}</td></tr>
            <tr><th>Fecha y lugar de expedicion</th><td>{{ $value($personal, 'issueDate') }} - {{ $value($personal, 'issuePlace') }}</td></tr>
            <tr><th>Fecha de nacimiento</th><td>{{ $value($personal, 'birthDate') }}</td></tr>
            <tr><th>Nacionalidad / pais residencia</th><td>{{ $value($personal, 'nationality') }} / {{ $value($personal, 'residenceCountry') }}</td></tr>
            <tr><th>Estado civil</th><td>{{ $value($personal, 'maritalStatus') }}</td></tr>
            <tr><th>Direccion</th><td>{{ $value($personal, 'residenceAddress') }}{{ filled($personal['neighborhood'] ?? null) ? ', barrio '.$personal['neighborhood'] : '' }}</td></tr>
            <tr><th>Ciudad / departamento</th><td>{{ $value($personal, 'city') }} / {{ $value($personal, 'department') }}</td></tr>
            <tr><th>Celular / correo</th><td>{{ $value($personal, 'mobile') }} / {{ $value($personal, 'email') }}</td></tr>
            <tr><th>Nivel educativo / profesion</th><td>{{ $value($personal, 'educationLevel') }} / {{ $value($personal, 'profession') }}</td></tr>
            <tr>
                <th>Personas a cargo</th>
                <td>
                    {{ $value($personal, 'hasDependents') }}
                    @if (($personal['hasDependents'] ?? null) === 'Si')
                        - {{ $value($personal, 'dependentsCount') }}
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. Informacion laboral</div>
        <table class="data-table">
            <tr><th>Empresa</th><td>{{ $value($employment, 'employer') }}</td></tr>
            <tr><th>Cargo</th><td>{{ $value($employment, 'position') }}</td></tr>
            <tr><th>Area / dependencia</th><td>{{ $value($employment, 'departmentArea') }}</td></tr>
            <tr>
                <th>Tipo de contrato</th>
                <td>
                    {{ $value($employment, 'contractType') }}
                    @if (($employment['contractType'] ?? null) === 'Otro' && filled($employment['contractTypeOther'] ?? null))
                        - {{ $employment['contractTypeOther'] }}
                    @endif
                </td>
            </tr>
            <tr><th>Fecha de ingreso</th><td>{{ $value($employment, 'hireDate') }}</td></tr>
            <tr><th>Ciudad donde trabaja</th><td>{{ $value($employment, 'workCity') }}</td></tr>
            <tr><th>Salario mensual</th><td>{{ $money($employment, 'monthlySalary') }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. Informacion economica</div>
        <table class="data-table">
            <tr><th>Ingreso mensual principal</th><td>{{ $money($financial, 'principalIncome') }}</td></tr>
            <tr><th>Otros ingresos mensuales</th><td>{{ $money($financial, 'otherIncome') }}</td></tr>
            <tr><th>Total ingresos mensuales</th><td>{{ $money($financial, 'totalIncome') }}</td></tr>
            <tr><th>Gastos mensuales</th><td>{{ $money($financial, 'monthlyExpenses') }}</td></tr>
            <tr><th>Obligaciones financieras</th><td>{{ $money($financial, 'financialObligations') }}</td></tr>
            <tr><th>Total egresos mensuales</th><td>{{ $money($financial, 'totalExpenses') }}</td></tr>
            <tr><th>Activos / pasivos / patrimonio</th><td>{{ $money($financial, 'assetsValue') }} / {{ $money($financial, 'liabilitiesValue') }} / {{ $money($financial, 'equityValue') }}</td></tr>
            <tr><th>Rango de ingresos</th><td>{{ $value($financial, 'incomeBand') }}</td></tr>
            <tr>
                <th>Ahorro voluntario</th>
                <td>
                    {{ $value($financial, 'voluntarySavings') }}
                    @if (($financial['voluntarySavings'] ?? null) === 'Si')
                        - {{ $money($financial, 'voluntarySavingsValue') }}
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">4. Beneficiarios y contacto de apoyo</div>
        @if ($beneficiaries !== [])
            <table class="beneficiary-table">
                <thead>
                    <tr>
                        <th style="width: 7%;">No.</th>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Parentesco</th>
                        <th>Fecha nacimiento</th>
                        <th>Telefono</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($beneficiaries as $index => $beneficiary)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td>{{ $value($beneficiary, 'fullName') }}</td>
                            <td>{{ $value($beneficiary, 'documentType') }} {{ $value($beneficiary, 'documentNumber', '') }}</td>
                            <td>
                                {{ $value($beneficiary, 'relationship') }}
                                @if (($beneficiary['relationship'] ?? null) === 'Otro' && filled($beneficiary['relationshipOther'] ?? null))
                                    - {{ $beneficiary['relationshipOther'] }}
                                @endif
                            </td>
                            <td>{{ $value($beneficiary, 'birthDate') }}</td>
                            <td>{{ $value($beneficiary, 'phone') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p class="muted" style="padding: 8px 10px;">No se registraron beneficiarios.</p>
        @endif

        <table class="data-table">
            <tr><th>Contacto de apoyo inmediato</th><td>{{ $value($emergencyContact, 'fullName') }} - {{ $value($emergencyContact, 'relationship') }} - {{ $value($emergencyContact, 'phone') }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title gold">5. Conocimiento del asociado - SARLAFT</div>
        <table class="data-table">
            <tr><th>Actividad economica</th><td>{{ $value($sarlaft, 'economicActivity') }}</td></tr>
            <tr>
                <th>Fuente de ingresos</th>
                <td>
                    {{ $list($sarlaft['incomeSource'] ?? []) }}
                    @if (in_array('Otro', $sarlaft['incomeSource'] ?? [], true) && filled($sarlaft['incomeSourceOther'] ?? null))
                        - {{ $sarlaft['incomeSourceOther'] }}
                    @endif
                </td>
            </tr>
            <tr>
                <th>Origen de recursos</th>
                <td>
                    {{ $list($sarlaft['resourceOrigin'] ?? []) }}
                    @if (in_array('Otro', $sarlaft['resourceOrigin'] ?? [], true) && filled($sarlaft['resourceOriginOther'] ?? null))
                        - {{ $sarlaft['resourceOriginOther'] }}
                    @endif
                </td>
            </tr>
            <tr><th>PEP</th><td>{{ $value($sarlaft, 'pep') }}</td></tr>
            @if (($sarlaft['pep'] ?? null) === 'Si')
                <tr><th>Detalle PEP</th><td>{{ $value($sarlaft, 'pepType') }} - {{ $value($sarlaft, 'pepPosition') }} - {{ $value($sarlaft, 'pepEntity') }}</td></tr>
                <tr><th>Fechas PEP</th><td>{{ $value($sarlaft, 'pepLinkDate') }} / {{ $value($sarlaft, 'pepUnlinkDate') }}</td></tr>
            @endif
            @if (filled($sarlaft['relatedPepName'] ?? null))
                <tr><th>Relacion con PEP</th><td>{{ $value($sarlaft, 'relatedPepName') }} - {{ $value($sarlaft, 'relatedPepRelation') }}</td></tr>
            @endif
            <tr><th>Cuentas en el exterior</th><td>{{ $value($sarlaft, 'foreignAccounts') }}</td></tr>
            @if (($sarlaft['foreignAccounts'] ?? null) === 'Si')
                <tr><th>Detalle cuenta exterior</th><td>{{ $value($sarlaft, 'foreignAccountCountry') }} - {{ $value($sarlaft, 'foreignAccountEntity') }} - {{ $value($sarlaft, 'foreignAccountType') }}</td></tr>
                <tr><th>Origen cuenta exterior</th><td>{{ $value($sarlaft, 'foreignAccountOrigin') }}</td></tr>
            @endif
            <tr><th>Actua por cuenta de terceros</th><td>{{ $value($sarlaft, 'actsOnBehalfOfThirdParties') }}</td></tr>
            @if (($sarlaft['actsOnBehalfOfThirdParties'] ?? null) === 'Si')
                <tr><th>Detalle tercero</th><td>{{ $value($sarlaft, 'thirdPartyName') }} - {{ $value($sarlaft, 'thirdPartyId') }} - {{ $value($sarlaft, 'thirdPartyRelation') }}</td></tr>
                <tr><th>Origen recursos tercero</th><td>{{ $value($sarlaft, 'thirdPartyOrigin') }}</td></tr>
            @endif
            <tr><th>Residencia fiscal</th><td>{{ $value($sarlaft, 'taxResidenceCountry') }}</td></tr>
            <tr><th>Obligaciones tributarias fuera del pais</th><td>{{ $value($sarlaft, 'hasForeignTaxObligations') }}</td></tr>
            @if (($sarlaft['hasForeignTaxObligations'] ?? null) === 'Si')
                <tr><th>Identificacion tributaria extranjera</th><td>{{ $value($sarlaft, 'foreignTaxId') }}</td></tr>
            @endif
            <tr>
                <th>Operaciones esperadas con el Fondo</th>
                <td>
                    {{ $list($sarlaft['expectedOperations'] ?? []) }}
                    @if (in_array('Otros servicios', $sarlaft['expectedOperations'] ?? [], true) && filled($sarlaft['expectedOperationsOther'] ?? null))
                        - {{ $sarlaft['expectedOperationsOther'] }}
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="notice">
        La informacion anterior fue suministrada por el solicitante para el proceso de afiliacion y queda sujeta a
        validacion documental, revision administrativa y politicas internas de FONASIN.
    </div>

    <div class="footer">
        Documento interno generado por FONASIN. No contiene URLs publicas de documentos ni claves privadas de almacenamiento.
    </div>
</body>
</html>
