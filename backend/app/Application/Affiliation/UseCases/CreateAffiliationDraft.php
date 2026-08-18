<?php

namespace App\Application\Affiliation\UseCases;

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Models\AffiliationApplication;
use App\Models\Associate;
use Illuminate\Support\Facades\DB;

class CreateAffiliationDraft
{
    public function __invoke(?Associate $associate = null): AffiliationApplication
    {
        return DB::transaction(fn () => AffiliationApplication::query()->create([
            'associate_id' => $associate?->id,
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]));
    }
}
