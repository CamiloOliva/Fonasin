<?php

namespace App\Infrastructure\Affiliation;

use App\Application\Affiliation\Contracts\RendersAffiliationSubmissionDocuments;
use App\Models\AffiliationApplication;
use Barryvdh\DomPDF\Facade\Pdf;

class LaravelDompdfAffiliationSubmissionRenderer implements RendersAffiliationSubmissionDocuments
{
    public function affiliationSummary(AffiliationApplication $application, array $sections): string
    {
        return Pdf::loadView('pdf.affiliation.summary', [
            'application' => $application,
            'sections' => $sections,
        ])->output();
    }

    public function payrollAuthorization(AffiliationApplication $application, array $sections, array $payroll): string
    {
        return Pdf::loadView('pdf.affiliation.payroll-authorization', [
            'application' => $application,
            'sections' => $sections,
            'payroll' => $payroll,
        ])->output();
    }
}
