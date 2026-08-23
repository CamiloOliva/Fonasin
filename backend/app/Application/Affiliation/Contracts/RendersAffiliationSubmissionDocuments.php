<?php

namespace App\Application\Affiliation\Contracts;

use App\Models\AffiliationApplication;

interface RendersAffiliationSubmissionDocuments
{
    /**
     * @param  array<string, array<string, mixed>>  $sections
     */
    public function affiliationSummary(AffiliationApplication $application, array $sections): string;

    /**
     * @param  array<string, array<string, mixed>>  $sections
     * @param  array<string, mixed>  $payroll
     */
    public function payrollAuthorization(AffiliationApplication $application, array $sections, array $payroll): string;
}
