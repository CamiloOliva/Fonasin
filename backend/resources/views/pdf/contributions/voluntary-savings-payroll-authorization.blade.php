<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 30px 36px 34px; }
        body { color: #172033; font-family: DejaVu Sans, sans-serif; font-size: 10px; line-height: 1.45; }
        table { border-collapse: collapse; width: 100%; }
        .topbar { border-bottom: 2px solid #004d26; padding-bottom: 10px; }
        .logo { height: 56px; width: 56px; object-fit: contain; }
        .brand-name { color: #004d26; font-size: 24px; font-weight: 900; margin: 0; }
        .brand-subtitle { color: #26364d; font-size: 8.8px; margin: 1px 0; text-transform: uppercase; }
        .meta { color: #26364d; font-size: 8.5px; text-align: right; }
        .meta strong { color: #004d26; }
        h1 { color: #004d26; font-size: 17px; margin: 18px 0 5px; text-align: center; text-transform: uppercase; }
        .intro { color: #5a667a; margin: 0 0 14px; text-align: center; }
        .date-line { font-size: 10.5px; margin: 16px 0 14px; text-align: right; }
        .salutation { border-left: 4px solid #008039; font-size: 10.5px; font-weight: 700; margin: 12px 0 16px; padding: 7px 10px; }
        .section { border: 1px solid #d8e1dc; margin-top: 13px; page-break-inside: avoid; }
        .section-title { background: #008039; color: #fff; font-weight: 900; padding: 7px 10px; text-transform: uppercase; }
        .summary td { border-bottom: 1px solid #edf1ef; padding: 6px 10px; vertical-align: top; width: 50%; }
        .label { color: #111827; display: block; font-size: 8.2px; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
        .value { color: #1f2937; display: block; min-height: 14px; }
        .paragraph { color: #374151; margin: 10px 12px; text-align: justify; }
        .concepts th { background: #eff8f2; border: 1px solid #d8e1dc; color: #004d26; padding: 7px; text-align: left; text-transform: uppercase; }
        .concepts td { border: 1px solid #edf1ef; padding: 7px; }
        .total td { background: #f1f8ef; color: #004d26; font-weight: 900; }
        .signature-box { border: 1px solid #64b87c; margin-top: 16px; page-break-inside: avoid; }
        .signature-title { background: #2f9b57; color: #fff; font-weight: 900; padding: 6px 10px; text-align: center; text-transform: uppercase; }
        .verified { background: #f1f8ef; color: #004d26; font-weight: 900; padding: 10px; text-align: center; }
        .signatures { margin-top: 28px; }
        .signatures td { padding-top: 24px; text-align: center; }
        .line { border-top: 1px solid #4b5563; margin: 0 auto 9px; width: 62%; }
        .footer { border-top: 1px solid #008039; color: #6b7280; font-size: 8px; margin-top: 14px; padding-top: 7px; text-align: center; }
    </style>
</head>
<body>
@php($money = static fn (mixed $value): string => '$ '.number_format((float) $value, 0, ',', '.'))

<div class="topbar">
    <table><tr>
        <td style="width: 66px;">@if (filled($logoDataUri ?? null))<img class="logo" src="{{ $logoDataUri }}" alt="FONASIN">@endif</td>
        <td><p class="brand-name">FONASIN</p><p class="brand-subtitle">Fondo de empleados del sector mineroenerg&eacute;tico</p><p class="brand-subtitle">NIT 900.861.038-8</p></td>
        <td class="meta" style="width: 245px;"><strong>Solicitud:</strong> {{ $requestId }}<br><strong>Firmada:</strong> {{ $acceptedAt }}<br><strong>Documento:</strong> Autorizaci&oacute;n de descuento por n&oacute;mina</td>
    </tr></table>
</div>

<p class="date-line">{{ $city }}, {{ $signatureDateLabel }}</p>
<div class="salutation">Se&ntilde;ores<br>DEPARTAMENTO DE N&Oacute;MINA</div>
<h1>Autorizaci&oacute;n descuento por n&oacute;mina</h1>
<p class="intro">Autorizaci&oacute;n expresa de ahorro voluntario con destino a FONASIN.</p>

<div class="section">
    <div class="section-title">1. Datos del solicitante</div>
    <table class="summary">
        <tr><td><span class="label">Nombre completo</span><span class="value">{{ $fullName ?: 'No registra' }}</span></td><td><span class="label">Documento</span><span class="value">{{ trim($documentType.' '.$documentNumber) ?: 'No registra' }}</span></td></tr>
        <tr><td><span class="label">Lugar de expedici&oacute;n</span><span class="value">{{ $issuePlace ?: 'No registra' }}</span></td><td><span class="label">Empresa donde labora</span><span class="value">{{ $employer ?: 'No registra' }}</span></td></tr>
        <tr><td><span class="label">Tel&eacute;fono / celular</span><span class="value">{{ $phone ?: 'No registra' }}</span></td><td><span class="label">Correo electr&oacute;nico</span><span class="value">{{ $email ?: 'No registra' }}</span></td></tr>
    </table>
</div>

<div class="section">
    <div class="section-title">2. Autorizaci&oacute;n</div>
    <p class="paragraph">Yo, {{ $fullName ?: 'No registra' }}, identificado(a) con {{ trim($documentType.' '.$documentNumber) ?: 'documento no registrado' }}, autorizo de manera expresa, previa, libre e irrevocable a mi empleador para realizar el descuento mensual indicado por concepto de ahorro voluntario y trasladarlo a FONASIN, NIT 900.861.038-8.</p>
    <p class="paragraph">Autorizo igualmente que, en caso de terminaci&oacute;n del v&iacute;nculo laboral, se apliquen las condiciones vigentes y los reglamentos del Fondo para los valores autorizados.</p>
</div>

<div class="section">
    <div class="section-title">3. Valores autorizados</div>
    <table class="summary"><tr><td><span class="label">Salario mensual reportado</span><span class="value">{{ $monthlySalary > 0 ? $money($monthlySalary) : 'No registra' }}</span></td><td><span class="label">Inicio de descuentos</span><span class="value">Por definir con el pagador</span></td></tr></table>
    <table class="concepts">
        <thead><tr><th>Concepto</th><th>Base</th><th>Valor autorizado</th><th>Periodicidad</th></tr></thead>
        <tbody>
            <tr><td>Ahorro voluntario</td><td>Valor fijo autorizado</td><td>{{ $money($voluntarySavings) }}</td><td>Mensual</td></tr>
            <tr class="total"><td colspan="2">Total descuento mensual autorizado</td><td>{{ $money($totalMonthlyDeduction) }}</td><td>Mensual</td></tr>
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">4. Tratamiento de datos y aceptaci&oacute;n</div>
    <p class="paragraph">Autorizo a FONASIN para el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y dem&aacute;s normas aplicables, exclusivamente para la gesti&oacute;n de este ahorro voluntario.</p>
    <p class="paragraph">Declaro que conozco y acepto las condiciones de la autorizaci&oacute;n y los reglamentos del Fondo. Esta autorizaci&oacute;n no constituye por s&iacute; misma un abono al saldo de ahorro.</p>
</div>

<div class="signature-box">
    <div class="signature-title">Firmado electr&oacute;nicamente por</div>
    <table class="summary">
        <tr><td><span class="label">Nombre</span><span class="value">{{ $fullName ?: 'No registra' }}</span></td><td><span class="label">Documento</span><span class="value">{{ trim($documentType.' '.$documentNumber) ?: 'No registra' }}</span></td></tr>
        <tr><td><span class="label">Correo</span><span class="value">{{ $email ?: 'No registra' }}</span></td><td><span class="label">Fecha y hora</span><span class="value">{{ $acceptedAt }}</span></td></tr>
        <tr><td><span class="label">M&eacute;todo</span><span class="value">Aceptaci&oacute;n electr&oacute;nica de la solicitud</span></td><td><span class="label">C&oacute;digo de verificaci&oacute;n</span><span class="value">{{ $verificationCode }}</span></td></tr>
    </table>
    <div class="verified">Firmado electr&oacute;nicamente</div>
</div>

<table class="signatures"><tr><td><div class="line"></div><strong>Aprobado pagador</strong><br>Firma del pagador</td></tr></table>
<div class="footer">Documento privado generado por FONASIN. Cada consulta y descarga queda registrada en auditor&iacute;a.</div>
</body>
</html>
