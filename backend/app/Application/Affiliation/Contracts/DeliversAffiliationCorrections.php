<?php

namespace App\Application\Affiliation\Contracts;

use App\Models\AffiliationApplication;
use Illuminate\Support\Carbon;

interface DeliversAffiliationCorrections
{
    public function send(AffiliationApplication $application, string $email, string $token, Carbon $expiresAt): void;
}
