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

        h1,
        h2,
        .center {
            text-align: center;
        }

        h1 {
            font-size: 15px;
            margin: 0;
            text-transform: uppercase;
        }

        h2 {
            font-size: 15px;
            margin: 18px 0;
            text-transform: uppercase;
        }

        table {
            border-collapse: collapse;
            margin: 12px 0;
            width: 100%;
        }

        th,
        td {
            border: 1px solid #111827;
            padding: 6px;
            text-align: left;
            vertical-align: top;
        }

        .line {
            border-bottom: 1px solid #111827;
            display: inline-block;
            min-width: 150px;
            padding: 0 8px 1px;
        }

        .wide {
            min-width: 260px;
        }

        .signature {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <h1>Fondo de Empleados del Sector Mineroenergetico, Empleados y Afiliados a Sintraelecol</h1>
    <h1>FONASIN</h1>
    <p class="center">NIT 900.861.038-8</p>

    <p>{{ $payroll['city'] }}, {{ $payroll['signature_date_label'] }}</p>

    <p>
        Señores<br>
        DEPARTAMENTO NOMINA
    </p>

    <h2>Autorizacion descuento por nomina</h2>

    <p>
        Yo, <span class="line wide">{{ $payroll['full_name'] }}</span>,
        en <span class="line">{{ $payroll['city'] }}</span>,
        quien labora en <span class="line wide">{{ $payroll['employer'] }}</span>,
        identificado(a) con cedula de ciudadania No.
        <span class="line">{{ $payroll['document_number'] }}</span>
        expedida en <span class="line">{{ $payroll['issue_place'] }}</span>,
        autorizo de manera expresa, previa, libre e irrevocable a mi empleador para que realice descuentos por nomina con destino a FONASIN, NIT 900861038-8, en mi calidad de afiliado(a).
    </p>

    <p>Salario mensual: $ <span class="line">{{ number_format($payroll['monthly_salary'], 0, ',', '.') }}</span></p>

    <p>El descuento se efectuara por los siguientes conceptos:</p>

    <table>
        <thead>
            <tr>
                <th>CONCEPTO</th>
                <th>BASE DE CALCULO</th>
                <th>VALOR AUTORIZADO</th>
                <th>PERIODICIDAD</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Aporte obligatorio</td>
                <td>1.5% del salario mensual</td>
                <td>$ {{ number_format($payroll['mandatory_contribution'], 0, ',', '.') }}</td>
                <td>Mensual</td>
            </tr>
            <tr>
                <td>Ahorro voluntario</td>
                <td>Valor fijo autorizado</td>
                <td>$ {{ number_format($payroll['voluntary_savings_value'], 0, ',', '.') }}</td>
                <td>Mensual</td>
            </tr>
            <tr>
                <td colspan="2"><strong>TOTAL DESCUENTO</strong></td>
                <td><strong>$ {{ number_format($payroll['total_discount'], 0, ',', '.') }}</strong></td>
                <td>Mensual</td>
            </tr>
        </tbody>
    </table>

    <p>
        <strong>AHORRO VOLUNTARIO</strong><br>
        {{ $payroll['voluntary_savings_applies'] ? 'X' : '_' }} Aplica<br>
        {{ $payroll['voluntary_savings_applies'] ? '_' : 'X' }} No aplica
    </p>

    <p>
        Los descuentos iniciaran a partir de la nomina correspondiente al mes de
        <span class="line">{{ $payroll['start_month'] }}</span>
        del ano <span class="line">{{ $payroll['start_year'] }}</span>.
    </p>

    <p>
        "Autorizo a FONASIN para el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y demas normas aplicables, exclusivamente para fines relacionados con mi vinculacion como asociado."
    </p>

    <p>
        Autorizo igualmente que, en caso de terminacion del vinculo laboral por cualquier causa, los valores pendientes sean descontados de mis salarios, prestaciones sociales, liquidacion final o cualquier otro pago a que tenga derecho, conforme a la normatividad vigente.
    </p>

    <p>Declaro que conozco y acepto las condiciones de la obligacion adquirida y los reglamentos del fondo.</p>

    <div class="signature">
        <p>Firma solicitante: <span class="line wide">&nbsp;</span> <span class="line wide">&nbsp;</span></p>
        <p>Nombre Completo: <span class="line wide">{{ $payroll['full_name'] }}</span></p>
        <p>C.C. No.: <span class="line">{{ $payroll['document_number'] }}</span></p>
        <p>Telefono: <span class="line">{{ $payroll['phone'] }}</span></p>
        <p>Correo: <span class="line wide">{{ $payroll['email'] }}</span></p>
    </div>

    <p>
        Aprobado<br>
        PAGADOR - Firma Autorizada
    </p>
</body>
</html>
