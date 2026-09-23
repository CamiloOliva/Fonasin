<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Autorizacion de ahorro voluntario</title>
    <style>
        body { color: #1f2937; font-family: DejaVu Sans, sans-serif; font-size: 11px; line-height: 1.55; margin: 34px; }
        .header { border-bottom: 4px solid #168447; padding-bottom: 14px; }
        .brand { color: #075c34; font-size: 24px; font-weight: 900; margin: 0; }
        .subtitle { color: #4b5563; margin: 2px 0 0; }
        h1 { color: #075c34; font-size: 19px; margin: 28px 0 18px; text-align: center; text-transform: uppercase; }
        .box { border: 1px solid #b7d8c3; margin: 16px 0; padding: 14px; }
        .label { color: #4b5563; font-size: 9px; font-weight: 700; text-transform: uppercase; }
        .value { font-size: 12px; font-weight: 700; }
        table { border-collapse: collapse; width: 100%; }
        td { border-bottom: 1px solid #e5e7eb; padding: 8px; width: 50%; }
        .amount { background: #eef8f1; color: #075c34; font-size: 18px; font-weight: 900; padding: 14px; text-align: center; }
        .acceptance { border: 1px solid #168447; margin-top: 26px; padding: 12px; text-align: center; }
        .footer { border-top: 1px solid #d1d5db; color: #6b7280; font-size: 8px; margin-top: 35px; padding-top: 8px; text-align: center; }
    </style>
</head>
<body>
<div class="header">
    <p class="brand">FONASIN</p>
    <p class="subtitle">Fondo de empleados del sector mineroenergetico - NIT 900.861.038-8</p>
</div>

<h1>Autorizacion de ahorro voluntario</h1>

<div class="box">
    <table>
        <tr>
            <td><div class="label">Asociado</div><div class="value">{{ $fullName }}</div></td>
            <td><div class="label">Documento</div><div class="value">{{ $documentType }} {{ $documentNumber }}</div></td>
        </tr>
        <tr>
            <td><div class="label">Fecha de solicitud</div><div class="value">{{ $submittedAt }}</div></td>
            <td><div class="label">Solicitud</div><div class="value">{{ $requestId }}</div></td>
        </tr>
    </table>
</div>

<p>
    Autorizo de manera expresa, previa y libre a mi empleador para descontar mensualmente de mi nomina
    el valor indicado a continuacion y trasladarlo a FONASIN como ahorro voluntario a mi nombre.
</p>

<div class="amount">Valor mensual autorizado: $ {{ number_format((float) $monthlyAmount, 0, ',', '.') }}</div>

<p>
    Esta autorizacion permanecera vigente hasta que solicite su modificacion o cancelacion por los canales
    dispuestos por FONASIN, sujeta a la validacion administrativa correspondiente.
</p>

<div class="acceptance">
    Aceptacion electronica registrada mediante la sesion protegida del portal asociado.<br>
    La fecha, el usuario y la IP protegida permanecen registrados en la auditoria interna.
</div>

<div class="footer">Documento privado generado por FONASIN para tramite de ahorro voluntario.</div>
</body>
</html>
