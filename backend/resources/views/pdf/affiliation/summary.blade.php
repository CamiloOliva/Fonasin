<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28px 34px 34px; }
        body { color: #172033; font-family: DejaVu Sans, sans-serif; font-size: 9.4px; line-height: 1.38; }
        .topbar { border-bottom: 2px solid #004d26; padding-bottom: 10px; }
        .brand-table, .grid, .beneficiary-table, .signature-table { border-collapse: collapse; width: 100%; }
        .logo { height: 54px; width: 54px; object-fit: contain; }
        .brand-name { color: #004d26; font-size: 24px; font-weight: 900; letter-spacing: .06em; margin: 0; }
        .brand-subtitle { color: #26364d; font-size: 9px; margin: 1px 0; text-transform: uppercase; }
        .meta { color: #26364d; font-size: 8.5px; text-align: right; }
        .meta strong { color: #004d26; }
        h1 { color: #004d26; font-size: 18px; letter-spacing: .04em; margin: 18px 0 5px; text-align: center; text-transform: uppercase; }
        .intro { color: #5a667a; font-size: 10px; margin: 0 0 16px; text-align: center; }
        .rule { border-top: 3px solid #008039; margin: 14px 0; }
        .section { border: 1px solid #d8e1dc; margin-top: 13px; page-break-inside: avoid; }
        .section-title { background: #008039; color: #fff; font-size: 10.5px; font-weight: 900; letter-spacing: .08em; padding: 7px 10px; text-transform: uppercase; }
        .subhead { border-bottom: 1px solid #a9c6b7; color: #006b32; font-size: 8.5px; font-weight: 900; letter-spacing: .03em; margin: 10px 10px 6px; padding-bottom: 4px; text-transform: uppercase; }
        .grid td { border-bottom: 1px solid #edf1ef; padding: 5px 10px; vertical-align: top; width: 25%; }
        .label { color: #111827; display: block; font-size: 8.2px; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
        .value { color: #1f2937; display: block; min-height: 14px; }
        .beneficiary-table th { background: #eff8f2; border: 1px solid #d8e1dc; color: #004d26; font-size: 8px; padding: 5px 6px; text-align: left; text-transform: uppercase; }
        .beneficiary-table td { border: 1px solid #edf1ef; padding: 5px 6px; vertical-align: top; }
        .paragraph { color: #374151; font-size: 9px; margin: 8px 10px; }
        .signature-box { border: 1px solid #ff6b00; margin-top: 14px; page-break-inside: avoid; }
        .signature-title { background: #f05a00; color: #fff; font-size: 10px; font-weight: 900; letter-spacing: .04em; padding: 6px 10px; text-align: center; text-transform: uppercase; }
        .signature-table td { border-bottom: 1px solid #f2e3d8; padding: 5px 10px; width: 50%; }
        .verified { background: #f1f8ef; border: 1px solid #7bbf8f; color: #004d26; font-weight: 900; margin: 8px 10px 10px; padding: 8px; text-align: center; text-transform: uppercase; }
        .verified small { color: #374151; display: block; font-size: 8px; font-weight: 400; margin-top: 3px; text-transform: none; }
        .footer { border-top: 1px solid #008039; color: #6b7280; font-size: 8px; margin-top: 15px; padding-top: 7px; text-align: center; }
        .muted { color: #6b7280; }
    </style>
</head>
<body>
@php
    $personal = $sections['personal'] ?? [];
    $employment = $sections['employment'] ?? [];
    $financial = $sections['financial'] ?? [];
    $beneficiariesPayload = $sections['beneficiaries'] ?? [];
    $sarlaft = $sections['sarlaft'] ?? [];

    $value = static fn (array $payload, string $key, string $fallback = 'No registra'): string => filled($payload[$key] ?? null) ? (string) $payload[$key] : $fallback;
    $money = static function (array $payload, string $key): string {
        $raw = $payload[$key] ?? null;
        if ($raw === null || $raw === '') return 'No registra';
        return '$ '.number_format((float) preg_replace('/[^\d.]/', '', (string) $raw), 0, ',', '.');
    };
    $list = static function (mixed $items): string {
        if (! is_array($items)) return filled($items) ? (string) $items : 'No registra';
        $filtered = array_values(array_filter($items, fn ($item): bool => is_scalar($item) && filled($item)));
        return $filtered === [] ? 'No registra' : implode(', ', $filtered);
    };
    $fullName = $signature['full_name'] ?? trim(implode(' ', array_filter([
        $personal['firstName'] ?? null,
        $personal['middleName'] ?? null,
        $personal['lastName'] ?? null,
        $personal['secondLastName'] ?? null,
    ], fn ($item): bool => filled($item))));
    $beneficiaries = array_values(array_filter(
        $beneficiariesPayload['beneficiaries'] ?? [],
        fn ($beneficiary): bool => is_array($beneficiary) && filled($beneficiary['fullName'] ?? null)
    ));
    $emergencyContact = is_array($beneficiariesPayload['emergencyContact'] ?? null) ? $beneficiariesPayload['emergencyContact'] : [];
@endphp

<div class="topbar">
    <table class="brand-table">
        <tr>
            <td style="width: 64px;">@if (is_file($logoPath ?? ''))<img class="logo" src="{{ $logoPath }}" alt="FONASIN">@endif</td>
            <td>
                <p class="brand-name">FONASIN</p>
                <p class="brand-subtitle">Fondo de empleados del sector mineroenerg&eacute;tico</p>
                <p class="brand-subtitle">NIT 900.861.038-8</p>
            </td>
            <td class="meta" style="width: 250px;">
                <strong>Solicitud:</strong> {{ $application->id }}<br>
                <strong>Generada:</strong> {{ now('America/Bogota')->format('Y-m-d H:i') }}<br>
                <strong>Documento:</strong> Formulario de afiliaci&oacute;n
            </td>
        </tr>
    </table>
</div>

<h1>Formulario de afiliaci&oacute;n</h1>
<p class="intro">Registro completo de informaci&oacute;n suministrada para revisi&oacute;n administrativa de FONASIN.</p>
<div class="rule"></div>

<div class="section">
    <div class="section-title">1. Datos personales y de contacto</div>
    <div class="subhead">Identificaci&oacute;n</div>
    <table class="grid">
        <tr>
            <td colspan="2"><span class="label">Nombre completo</span><span class="value">{{ $fullName !== '' ? $fullName : 'No registra' }}</span></td>
            <td><span class="label">Documento</span><span class="value">{{ $value($personal, 'documentType') }} {{ $value($personal, 'documentNumber', '') }}</span></td>
            <td><span class="label">Fecha nacimiento</span><span class="value">{{ $value($personal, 'birthDate') }}</span></td>
        </tr>
        <tr>
            <td colspan="2"><span class="label">Fecha y lugar de expedici&oacute;n</span><span class="value">{{ $value($personal, 'issueDate') }} - {{ $value($personal, 'issuePlace') }}</span></td>
            <td><span class="label">Nacionalidad</span><span class="value">{{ $value($personal, 'nationality') }}</span></td>
            <td><span class="label">Estado civil</span><span class="value">{{ $value($personal, 'maritalStatus') }}</span></td>
        </tr>
    </table>
    <div class="subhead">Direcci&oacute;n y ubicaci&oacute;n</div>
    <table class="grid">
        <tr>
            <td colspan="2"><span class="label">Direcci&oacute;n</span><span class="value">{{ $value($personal, 'residenceAddress') }}</span></td>
            <td><span class="label">Barrio</span><span class="value">{{ $value($personal, 'neighborhood', '-') }}</span></td>
            <td><span class="label">Pa&iacute;s residencia</span><span class="value">{{ $value($personal, 'residenceCountry') }}</span></td>
        </tr>
        <tr>
            <td colspan="2"><span class="label">Ciudad / Departamento</span><span class="value">{{ $value($personal, 'city') }} / {{ $value($personal, 'department') }}</span></td>
            <td><span class="label">Celular</span><span class="value">{{ $value($personal, 'mobile') }}</span></td>
            <td><span class="label">Correo electr&oacute;nico</span><span class="value">{{ $value($personal, 'email') }}</span></td>
        </tr>
    </table>
    <div class="subhead">Educaci&oacute;n y ocupaci&oacute;n actual</div>
    <table class="grid">
        <tr>
            <td colspan="2"><span class="label">Nivel educativo / Profesi&oacute;n</span><span class="value">{{ $value($personal, 'educationLevel') }} / {{ $value($personal, 'profession') }}</span></td>
            <td colspan="2"><span class="label">Personas a cargo</span><span class="value">{{ $value($personal, 'hasDependents') }} @if (($personal['hasDependents'] ?? null) === 'Si') - {{ $value($personal, 'dependentsCount') }} @endif</span></td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">2. Informaci&oacute;n laboral</div>
    <table class="grid">
        <tr>
            <td colspan="2"><span class="label">Empresa</span><span class="value">{{ $value($employment, 'employer') }}</span></td>
            <td><span class="label">Cargo</span><span class="value">{{ $value($employment, 'position') }}</span></td>
            <td><span class="label">&Aacute;rea / dependencia</span><span class="value">{{ $value($employment, 'departmentArea') }}</span></td>
        </tr>
        <tr>
            <td><span class="label">Tipo de contrato</span><span class="value">{{ $value($employment, 'contractType') }} @if (($employment['contractType'] ?? null) === 'Otro' && filled($employment['contractTypeOther'] ?? null)) - {{ $employment['contractTypeOther'] }} @endif</span></td>
            <td><span class="label">Fecha de ingreso</span><span class="value">{{ $value($employment, 'hireDate') }}</span></td>
            <td><span class="label">Ciudad donde trabaja</span><span class="value">{{ $value($employment, 'workCity') }}</span></td>
            <td><span class="label">Salario mensual</span><span class="value">{{ $money($employment, 'monthlySalary') }}</span></td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">3. Informaci&oacute;n econ&oacute;mica</div>
    <table class="grid">
        <tr>
            <td><span class="label">Ingreso mensual principal</span><span class="value">{{ $money($financial, 'principalIncome') }}</span></td>
            <td><span class="label">Otros ingresos mensuales</span><span class="value">{{ $money($financial, 'otherIncome') }}</span></td>
            <td><span class="label">Total ingresos mensuales</span><span class="value">{{ $money($financial, 'totalIncome') }}</span></td>
            <td><span class="label">Rango ingresos</span><span class="value">{{ $value($financial, 'incomeBand') }}</span></td>
        </tr>
        <tr>
            <td><span class="label">Gastos mensuales</span><span class="value">{{ $money($financial, 'monthlyExpenses') }}</span></td>
            <td><span class="label">Obligaciones financieras</span><span class="value">{{ $money($financial, 'financialObligations') }}</span></td>
            <td><span class="label">Total egresos mensuales</span><span class="value">{{ $money($financial, 'totalExpenses') }}</span></td>
            <td><span class="label">Ahorro voluntario</span><span class="value">{{ $value($financial, 'voluntarySavings') }} @if (($financial['voluntarySavings'] ?? null) === 'Si') - {{ $money($financial, 'voluntarySavingsValue') }} @endif</span></td>
        </tr>
        <tr>
            <td><span class="label">Activos</span><span class="value">{{ $money($financial, 'assetsValue') }}</span></td>
            <td><span class="label">Pasivos</span><span class="value">{{ $money($financial, 'liabilitiesValue') }}</span></td>
            <td colspan="2"><span class="label">Patrimonio</span><span class="value">{{ $money($financial, 'equityValue') }}</span></td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">4. Beneficiarios y contacto de apoyo</div>
    @if ($beneficiaries !== [])
        <table class="beneficiary-table">
            <thead><tr><th style="width: 6%;">No.</th><th>Nombre</th><th>Documento</th><th>Parentesco</th><th>Fecha nacimiento</th><th>Tel&eacute;fono</th><th style="width: 9%;">%</th></tr></thead>
            <tbody>
            @foreach ($beneficiaries as $index => $beneficiary)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $value($beneficiary, 'fullName') }}</td>
                    <td>{{ $value($beneficiary, 'documentType') }} {{ $value($beneficiary, 'documentNumber', '') }}</td>
                    <td>{{ $value($beneficiary, 'relationship') }} @if (($beneficiary['relationship'] ?? null) === 'Otro' && filled($beneficiary['relationshipOther'] ?? null)) - {{ $beneficiary['relationshipOther'] }} @endif</td>
                    <td>{{ $value($beneficiary, 'birthDate') }}</td>
                    <td>{{ $value($beneficiary, 'phone') }}</td>
                    <td>{{ $value($beneficiary, 'percentage', '-') }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    @else
        <p class="paragraph muted">No se registraron beneficiarios.</p>
    @endif
    <table class="grid"><tr><td colspan="4"><span class="label">Contacto de apoyo inmediato</span><span class="value">{{ $value($emergencyContact, 'fullName') }} - {{ $value($emergencyContact, 'relationship') }} - {{ $value($emergencyContact, 'phone') }}</span></td></tr></table>
</div>

<div class="section">
    <div class="section-title">5. Conocimiento del asociado - SARLAFT</div>
    <table class="grid">
        <tr>
            <td><span class="label">Actividad econ&oacute;mica</span><span class="value">{{ $value($sarlaft, 'economicActivity') }}</span></td>
            <td><span class="label">Fuente de ingresos</span><span class="value">{{ $list($sarlaft['incomeSource'] ?? []) }} @if (in_array('Otro', $sarlaft['incomeSource'] ?? [], true) && filled($sarlaft['incomeSourceOther'] ?? null)) - {{ $sarlaft['incomeSourceOther'] }} @endif</span></td>
            <td><span class="label">Origen de recursos</span><span class="value">{{ $list($sarlaft['resourceOrigin'] ?? []) }} @if (in_array('Otro', $sarlaft['resourceOrigin'] ?? [], true) && filled($sarlaft['resourceOriginOther'] ?? null)) - {{ $sarlaft['resourceOriginOther'] }} @endif</span></td>
            <td><span class="label">PEP</span><span class="value">{{ $value($sarlaft, 'pep') }}</span></td>
        </tr>
        @if (($sarlaft['pep'] ?? null) === 'Si')
            <tr>
                <td colspan="2"><span class="label">Detalle PEP</span><span class="value">{{ $value($sarlaft, 'pepType') }} - {{ $value($sarlaft, 'pepPosition') }} - {{ $value($sarlaft, 'pepEntity') }}</span></td>
                <td colspan="2"><span class="label">Fechas PEP</span><span class="value">{{ $value($sarlaft, 'pepLinkDate') }} / {{ $value($sarlaft, 'pepUnlinkDate') }}</span></td>
            </tr>
        @endif
        @if (filled($sarlaft['relatedPepName'] ?? null))
            <tr><td colspan="4"><span class="label">Relaci&oacute;n con PEP</span><span class="value">{{ $value($sarlaft, 'relatedPepName') }} - {{ $value($sarlaft, 'relatedPepRelation') }}</span></td></tr>
        @endif
        <tr>
            <td><span class="label">Cuentas en el exterior</span><span class="value">{{ $value($sarlaft, 'foreignAccounts') }}</span></td>
            <td><span class="label">Act&uacute;a por cuenta de terceros</span><span class="value">{{ $value($sarlaft, 'actsOnBehalfOfThirdParties') }}</span></td>
            <td><span class="label">Residencia fiscal</span><span class="value">{{ $value($sarlaft, 'taxResidenceCountry') }}</span></td>
            <td><span class="label">Obligaciones tributarias fuera del pa&iacute;s</span><span class="value">{{ $value($sarlaft, 'hasForeignTaxObligations') }}</span></td>
        </tr>
        <tr><td colspan="4"><span class="label">Operaciones esperadas con el Fondo</span><span class="value">{{ $list($sarlaft['expectedOperations'] ?? []) }} @if (in_array('Otros servicios', $sarlaft['expectedOperations'] ?? [], true) && filled($sarlaft['expectedOperationsOther'] ?? null)) - {{ $sarlaft['expectedOperationsOther'] }} @endif</span></td></tr>
    </table>
</div>

<div class="section">
    <div class="section-title">Declaraciones y autorizaciones</div>
    <p class="paragraph">Declaro bajo la gravedad del juramento que toda la informaci&oacute;n consignada en este formulario es veraz y que los recursos solicitados no provienen ni se destinar&aacute;n a actividades il&iacute;citas.</p>
    <p class="paragraph">La informaci&oacute;n suministrada por el solicitante queda sujeta a validaci&oacute;n documental, revisi&oacute;n administrativa y pol&iacute;ticas internas de FONASIN.</p>
    <p class="paragraph">Autorizo a FONASIN para realizar el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.</p>
</div>

<div class="signature-box">
    <div class="signature-title">Firmado electr&oacute;nicamente por</div>
    <table class="signature-table">
        <tr>
            <td><span class="label">Nombre</span><span class="value">{{ $signature['full_name'] ?? 'No registra' }}</span></td>
            <td><span class="label">Documento</span><span class="value">{{ $signature['document'] ?? 'No registra' }}</span></td>
        </tr>
        <tr>
            <td><span class="label">Correo</span><span class="value">{{ $signature['email'] ?? 'No registra' }}</span></td>
            <td><span class="label">Fecha y hora</span><span class="value">{{ $signature['signed_at_label'] ?? 'No registra' }}</span></td>
        </tr>
        <tr>
            <td><span class="label">M&eacute;todo</span><span class="value">Aceptaci&oacute;n electr&oacute;nica del formulario</span></td>
            <td><span class="label">C&oacute;digo de verificaci&oacute;n</span><span class="value">{{ $signature['verification_hash'] ?? 'No registra' }}</span></td>
        </tr>
        <tr>
            <td colspan="2"><span class="label">IP</span><span class="value">Registrada en auditor&iacute;a interna</span></td>
        </tr>
    </table>
    <div class="verified">
        Firmado electr&oacute;nicamente
        <small>Este documento fue generado y firmado electr&oacute;nicamente conforme al consentimiento registrado por el solicitante.</small>
    </div>
</div>

<div class="footer">Documento interno generado por FONASIN. La IP completa permanece registrada de forma protegida en auditor&iacute;a.</div>
</body>
</html>
