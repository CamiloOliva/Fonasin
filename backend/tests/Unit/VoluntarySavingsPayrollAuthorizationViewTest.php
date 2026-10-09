<?php

namespace Tests\Unit;

use Barryvdh\DomPDF\Facade\Pdf;
use Tests\TestCase;

class VoluntarySavingsPayrollAuthorizationViewTest extends TestCase
{
    public function test_voluntary_payroll_authorization_uses_only_the_new_savings_amount(): void
    {
        $data = [
            'requestId' => 'request-test',
            'fullName' => 'Asociada de prueba',
            'documentType' => 'CC',
            'documentNumber' => '123456789',
            'issuePlace' => 'Bucaramanga',
            'employer' => 'Empresa de prueba',
            'phone' => '3000000000',
            'email' => 'associate@example.test',
            'monthlySalary' => 2500000,
            'voluntarySavings' => 150000,
            'totalMonthlyDeduction' => 150000,
            'city' => 'Bucaramanga',
            'signatureDateLabel' => '8 de octubre de 2026',
            'acceptedAt' => '2026-10-08 22:18:00',
            'logoDataUri' => null,
        ];

        $html = view('pdf.contributions.voluntary-savings-payroll-authorization', $data)->render();
        $plainText = html_entity_decode(strip_tags($html));

        $this->assertStringContainsString('Ahorro voluntario', $plainText);
        $this->assertSame(2, substr_count($plainText, '$ 150.000'));
        $this->assertStringNotContainsString('Aporte obligatorio', $plainText);
        $this->assertStringContainsString('los valores pendientes sean descontados de mis salarios', $plainText);
        $this->assertStringContainsString('Aceptación registrada', $plainText);
        $this->assertStringNotContainsString('Firmado electrónicamente', $plainText);
        $this->assertStringNotContainsString('Código de verificación', $plainText);

        $pdf = Pdf::loadView('pdf.contributions.voluntary-savings-payroll-authorization', $data)->output();
        $this->assertStringStartsWith('%PDF-', $pdf);
        $this->assertStringContainsString('%%EOF', $pdf);
    }
}
