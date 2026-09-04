<?php

namespace App\Infrastructure\Affiliation;

use App\Application\Affiliation\Contracts\RendersAffiliationSubmissionDocuments;
use App\Models\AffiliationApplication;
use Barryvdh\DomPDF\Facade\Pdf;

class LaravelDompdfAffiliationSubmissionRenderer implements RendersAffiliationSubmissionDocuments
{
    public function affiliationSummary(AffiliationApplication $application, array $sections, array $signature): string
    {
        return Pdf::loadView('pdf.affiliation.summary', [
            'application' => $application,
            'sections' => $sections,
            'signature' => $signature,
            'logoPath' => public_path('logotipo.png'),
        ])->output();
    }

    public function payrollAuthorization(AffiliationApplication $application, array $sections, array $payroll): string
    {
        return Pdf::loadView('pdf.affiliation.payroll-authorization', [
            'application' => $application,
            'sections' => $sections,
            'payroll' => $payroll,
            'logoPath' => public_path('logotipo.png'),
        ])->output();
    }
}
