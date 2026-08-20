<?php

namespace App\Application\Affiliation\UseCases;

use App\Domain\Affiliation\Enums\ConsentType;
use App\Models\AffiliationApplication;
use App\Models\ConsentRecord;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AcceptApplicationConsent
{
    public function __invoke(
        AffiliationApplication $application,
        ConsentType $consentType,
        string $policyVersion,
        ?string $ipHash = null,
        ?Carbon $acceptedAt = null,
    ): ConsentRecord {
        return DB::transaction(function () use ($application, $consentType, $policyVersion, $ipHash, $acceptedAt) {
            $consent = ConsentRecord::query()->firstOrNew([
                'application_id' => $application->id,
                'consent_type' => $consentType->value,
                'policy_version' => $policyVersion,
            ]);

            if ($consent->exists) {
                return $consent;
            }

            $consent->forceFill([
                'accepted_at' => $acceptedAt ?? now(),
                'ip_hash' => $ipHash,
            ]);

            $consent->save();

            return $consent;
        });
    }
}
