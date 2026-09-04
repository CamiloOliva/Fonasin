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
            'logoDataUri' => $this->logoDataUri(),
        ])->output();
    }

    public function payrollAuthorization(AffiliationApplication $application, array $sections, array $payroll): string
    {
        return Pdf::loadView('pdf.affiliation.payroll-authorization', [
            'application' => $application,
            'sections' => $sections,
            'payroll' => $payroll,
            'logoDataUri' => $this->logoDataUri(),
        ])->output();
    }

    private function logoDataUri(): ?string
    {
        $path = base_path('../public/logotipo.png');

        if (! is_file($path)) {
            return null;
        }

        $contents = file_get_contents($path);

        return $contents === false ? null : 'data:image/png;base64,'.base64_encode($contents);
    }
}
