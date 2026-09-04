<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 30px 36px 34px; }
        body { color: #172033; font-family: DejaVu Sans, sans-serif; font-size: 10px; line-height: 1.45; }
        .brand-table, .summary-table, .concept-table, .signature-table, .signatures { border-collapse: collapse; width: 100%; }
        .topbar { border-bottom: 2px solid #004d26; padding-bottom: 10px; }
        .logo { height: 56px; width: 56px; object-fit: contain; }
        .brand-name { color: #004d26; font-size: 24px; font-weight: 900; letter-spacing: .06em; margin: 0; }
        .brand-subtitle { color: #26364d; font-size: 8.8px; margin: 1px 0; text-transform: uppercase; }
        .meta { color: #26364d; font-size: 8.5px; text-align: right; }
        .meta strong { color: #004d26; }
        h1 { color: #004d26; font-size: 17px; letter-spacing: .04em; margin: 18px 0 5px; text-align: center; text-transform: uppercase; }
        .intro { color: #5a667a; font-size: 9.5px; margin: 0 0 14px; text-align: center; }
        .date-line { font-size: 10.5px; margin: 16px 0 14px; text-align: right; }
        .salutation { border-left: 4px solid #008039; color: #172033; font-size: 10.5px; font-weight: 700; margin: 12px 0 16px; padding: 7px 10px; }
        .section { border: 1px solid #d8e1dc; margin-top: 13px; page-break-inside: avoid; }
        .section-title { background: #008039; color: #fff; font-size: 10.5px; font-weight: 900; letter-spacing: .07em; padding: 7px 10px; text-transform: uppercase; }
        .summary-table td { border-bottom: 1px solid #edf1ef; padding: 6px 10px; vertical-align: top; width: 50%; }
        .label { color: #111827; display: block; font-size: 8.2px; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
        .value { color: #1f2937; display: block; min-height: 14px; }
        .paragraph { color: #374151; font-size: 9.4px; margin: 10px 12px; text-align: justify; }
        .concept-table th { background: #eff8f2; border: 1px solid #d8e1dc; color: #004d26; font-size: 8.3px; padding: 6px; text-align: left; text-transform: uppercase; }
        .concept-table td { border: 1px solid #edf1ef; padding: 6px; vertical-align: top; }
        .total-row td { background: #f6fbf7; color: #004d26; font-weight: 900; }
        .signature-box { border: 1px solid #64b87c; margin-top: 16px; page-break-inside: avoid; }
        .signature-title { background: #2f9b57; color: #fff; font-size: 10px; font-weight: 900; letter-spacing: .04em; padding: 6px 10px; text-align: center; text-transform: uppercase; }
        .signature-table td { border-bottom: 1px solid #dcefe2; padding: 5px 10px; width: 50%; }
        .verified { background: #f1f8ef; border: 1px solid #7bbf8f; color: #004d26; font-weight: 900; margin: 8px 10px 10px; padding: 8px; text-align: center; text-transform: uppercase; }
        .verified small { color: #374151; display: block; font-size: 8px; font-weight: 400; margin-top: 3px; text-transform: none; }
        .signatures { margin-top: 28px; }
        .signatures td { padding-top: 24px; text-align: center; vertical-align: top; width: 100%; }
        .line { border-top: 1px solid #4b5563; margin: 0 auto 9px; width: 62%; }
        .signature-label { color: #111827; font-size: 8.5px; font-weight: 900; text-transform: uppercase; }
        .footer { border-top: 1px solid #008039; color: #6b7280; font-size: 8px; margin-top: 14px; padding-top: 7px; text-align: center; }
    </style>
</head>
<body>
@php
    $signature = $payroll['signature'] ?? [];
    $money = static fn (mixed $value): string => '$ '.number_format((float) $value, 0, ',', '.');
@endphp

<div class="topbar">
    <table class="brand-table">
        <tr>
            <td style="width: 66px;">@if (filled($logoDataUri ?? null))<img class="logo" src="{{ $logoDataUri }}" alt="FONASIN">@endif</td>
            <td>
                <p class="brand-name">FONASIN</p>
                <p class="brand-subtitle">Fondo de empleados del sector mineroenerg&eacute;tico</p>
                <p class="brand-subtitle">NIT 900.861.038-8</p>
            </td>
            <td class="meta" style="width: 240px;">
                <strong>Solicitud:</strong> {{ $application->id }}<br>
                <strong>Generada:</strong> {{ now('America/Bogota')->format('Y-m-d H:i') }}<br>
                <strong>Documento:</strong> Autorizaci&oacute;n de descuento por n&oacute;mina
            </td>
        </tr>
    </table>
</div>

<p class="date-line">{{ $payroll['city'] }}, {{ $payroll['signature_date_label'] }}</p>

<div class="salutation">
    Se&ntilde;ores<br>
    DEPARTAMENTO DE N&Oacute;MINA
</div>

<h1>Autorizaci&oacute;n descuento por n&oacute;mina</h1>
<p class="intro">Autorizaci&oacute;n expresa de descuentos con destino a FONASIN.</p>

<div class="section">
    <div class="section-title">1. Datos del solicitante</div>
    <table class="summary-table">
        <tr>
            <td><span class="label">Nombre completo</span><span class="value">{{ $payroll['full_name'] ?: 'No registra' }}</span></td>
            <td><span class="label">Documento</span><span class="value">{{ $payroll['document_number'] ?: 'No registra' }}</span></td>
        </tr>
        <tr>
            <td><span class="label">Lugar de expedici&oacute;n</span><span class="value">{{ $payroll['issue_place'] ?: 'No registra' }}</span></td>
            <td><span class="label">Empresa donde labora</span><span class="value">{{ $payroll['employer'] ?: 'No registra' }}</span></td>
        </tr>
        <tr>
            <td><span class="label">Tel&eacute;fono / celular</span><span class="value">{{ $payroll['phone'] ?: 'No registra' }}</span></td>
            <td><span class="label">Correo electr&oacute;nico</span><span class="value">{{ $payroll['email'] ?: 'No registra' }}</span></td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">2. Autorizaci&oacute;n</div>
    <p class="paragraph">
        Yo, {{ $payroll['full_name'] ?: 'No registra' }}, identificado(a) con documento No.
        {{ $payroll['document_number'] ?: 'No registra' }}, autorizo de manera expresa, previa, libre e irrevocable a mi
        empleador para realizar descuentos por n&oacute;mina con destino a FONASIN, NIT 900.861.038-8, en mi calidad de afiliado(a).
    </p>
    <p class="paragraph">
        Autorizo igualmente que, en caso de terminaci&oacute;n del v&iacute;nculo laboral por cualquier causa, los valores pendientes sean
        descontados de salarios, prestaciones sociales, liquidaci&oacute;n final o cualquier otro pago a que tenga derecho, conforme a
        la normatividad vigente.
    </p>
</div>

<div class="section">
    <div class="section-title">3. Valores autorizados</div>
    <table class="summary-table">
        <tr>
            <td><span class="label">Salario mensual reportado</span><span class="value">{{ $money($payroll['monthly_salary']) }}</span></td>
            <td><span class="label">Inicio de descuentos</span><span class="value">{{ $payroll['start_month'] ?: 'Por definir' }} {{ $payroll['start_year'] ?: '' }}</span></td>
        </tr>
    </table>
    <table class="concept-table">
        <thead>
            <tr>
                <th>Concepto</th>
                <th>Base de c&aacute;lculo</th>
                <th>Valor autorizado</th>
                <th>Periodicidad</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Aporte obligatorio</td>
                <td>1.5% del salario mensual</td>
                <td>{{ $money($payroll['mandatory_contribution']) }}</td>
                <td>Mensual</td>
            </tr>
            <tr>
                <td>Ahorro voluntario</td>
                <td>{{ $payroll['voluntary_savings_applies'] ? 'Valor fijo autorizado' : 'No aplica' }}</td>
                <td>{{ $money($payroll['voluntary_savings_value']) }}</td>
                <td>Mensual</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Total descuento mensual</td>
                <td>{{ $money($payroll['total_discount']) }}</td>
                <td>Mensual</td>
            </tr>
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">4. Tratamiento de datos y aceptaci&oacute;n</div>
    <p class="paragraph">
        Autorizo a FONASIN para el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y dem&aacute;s normas
        aplicables, exclusivamente para fines relacionados con mi vinculaci&oacute;n como asociado.
    </p>
    <p class="paragraph">Declaro que conozco y acepto las condiciones de la obligaci&oacute;n adquirida y los reglamentos del Fondo.</p>
</div>

<div class="signature-box">
    <div class="signature-title">Firmado electr&oacute;nicamente por</div>
    <table class="signature-table">
        <tr>
            <td><span class="label">Nombre</span><span class="value">{{ $signature['full_name'] ?? 'No registra' }}</span></td>
            <td><span class="label">Documento</span><span class="value">{{ $signature['document'] ?? $payroll['document_number'] }}</span></td>
        </tr>
        <tr>
            <td><span class="label">Correo</span><span class="value">{{ $signature['email'] ?? $payroll['email'] }}</span></td>
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

<table class="signatures">
    <tr>
        <td>
            <div class="line"></div>
            <div class="signature-label">Aprobado Pagador</div>
            Firma del pagador
        </td>
    </tr>
</table>

<div class="footer">Documento interno generado por FONASIN. La IP completa permanece registrada de forma protegida en auditor&iacute;a.</div>
</body>
</html>
