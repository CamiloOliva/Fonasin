<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 30px 36px 34px; }
        body { color: #172033; font-family: DejaVu Sans, sans-serif; font-size: 10px; line-height: 1.5; }
        table { border-collapse: collapse; width: 100%; }
        .topbar { border-bottom: 2px solid #004d26; padding-bottom: 10px; }
        .logo { height: 56px; width: 56px; object-fit: contain; }
        .brand-name { color: #004d26; font-size: 24px; font-weight: 900; margin: 0; }
        .brand-subtitle { color: #26364d; font-size: 8.8px; margin: 1px 0; text-transform: uppercase; }
        .meta { color: #26364d; font-size: 8.5px; text-align: right; }
        .meta strong { color: #004d26; }
        h1 { color: #004d26; font-size: 17px; margin: 18px 0 5px; text-align: center; text-transform: uppercase; }
        .intro { color: #5a667a; margin: 0 0 16px; text-align: center; }
        .salutation { border-left: 4px solid #008039; font-size: 10.5px; font-weight: 700; margin: 12px 0 16px; padding: 7px 10px; }
        .section { border: 1px solid #d8e1dc; margin-top: 13px; page-break-inside: avoid; }
        .section-title { background: #008039; color: #fff; font-weight: 900; padding: 7px 10px; text-transform: uppercase; }
        .summary td { border-bottom: 1px solid #edf1ef; padding: 7px 10px; width: 50%; }
        .label { color: #111827; display: block; font-size: 8.2px; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
        .value { color: #1f2937; display: block; }
        .paragraph { color: #374151; margin: 10px 12px; text-align: justify; }
        .concepts th { background: #eff8f2; border: 1px solid #d8e1dc; color: #004d26; padding: 7px; text-align: left; text-transform: uppercase; }
        .concepts td { border: 1px solid #edf1ef; padding: 7px; }
        .total td { background: #f1f8ef; color: #004d26; font-weight: 900; }
        .verified { background: #f1f8ef; border: 1px solid #7bbf8f; color: #004d26; font-weight: 900; margin-top: 16px; padding: 10px; text-align: center; }
        .footer { border-top: 1px solid #008039; color: #6b7280; font-size: 8px; margin-top: 18px; padding-top: 7px; text-align: center; }
    </style>
</head>
<body>
@php($money = static fn (mixed $value): string => '$ '.number_format((float) $value, 0, ',', '.'))

<div class="topbar">
    <table>
        <tr>
            <td style="width: 66px;">@if (filled($logoDataUri ?? null))<img class="logo" src="{{ $logoDataUri }}" alt="FONASIN">@endif</td>
            <td>
                <p class="brand-name">FONASIN</p>
                <p class="brand-subtitle">Fondo de empleados del sector mineroenerg&eacute;tico</p>
                <p class="brand-subtitle">NIT 900.861.038-8</p>
            </td>
            <td class="meta" style="width: 245px;">
                <strong>Solicitud:</strong> {{ $requestId }}<br>
                <strong>Aceptada:</strong> {{ $acceptedAt }}<br>
                <strong>Documento:</strong> Libranza de ahorro voluntario
            </td>
        </tr>
    </table>
</div>

<div class="salutation">Se&ntilde;ores<br>DEPARTAMENTO DE N&Oacute;MINA</div>
<h1>Autorizaci&oacute;n de descuento por n&oacute;mina</h1>
<p class="intro">Modificaci&oacute;n de descuento mensual con destino a FONASIN.</p>

<div class="section">
    <div class="section-title">1. Datos del asociado</div>
    <table class="summary">
        <tr>
            <td><span class="label">Nombre completo</span><span class="value">{{ $fullName }}</span></td>
            <td><span class="label">Documento</span><span class="value">{{ $documentType }} {{ $documentNumber }}</span></td>
        </tr>
        <tr>
            <td colspan="2"><span class="label">Correo</span><span class="value">{{ $email ?: 'No registra' }}</span></td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">2. Valores mensuales autorizados</div>
    <table class="concepts">
        <thead><tr><th>Concepto</th><th>Valor mensual</th><th>Estado</th></tr></thead>
        <tbody>
            <tr><td>Aporte vigente registrado</td><td>{{ $money($monthlyContribution) }}</td><td>Vigente</td></tr>
            <tr><td>Ahorro voluntario solicitado</td><td>{{ $money($voluntarySavings) }}</td><td>Nueva solicitud</td></tr>
            <tr class="total"><td>Total mensual a descontar</td><td>{{ $money($totalMonthlyDeduction) }}</td><td>Autorizado</td></tr>
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">3. Autorizaci&oacute;n</div>
    <p class="paragraph">
        Yo, {{ $fullName }}, identificado(a) con {{ $documentType }} {{ $documentNumber }}, autorizo expresamente a mi
        empleador a descontar mensualmente los valores indicados y trasladarlos a FONASIN. Esta solicitud modifica el
        componente de ahorro voluntario y no registra por s&iacute; misma un pago ni aumenta el saldo ahorrado.
    </p>
</div>

<div class="verified">
    Aceptaci&oacute;n electr&oacute;nica registrada<br>
    <span class="label">C&oacute;digo de verificaci&oacute;n: {{ $verificationCode }}</span>
</div>

<div class="footer">Documento privado para gesti&oacute;n administrativa de FONASIN. Cada consulta y descarga queda auditada.</div>
</body>
</html>
