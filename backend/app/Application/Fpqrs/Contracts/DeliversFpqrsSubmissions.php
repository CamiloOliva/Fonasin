<?php

namespace App\Application\Fpqrs\Contracts;

use App\Models\FpqrsSubmission;

interface DeliversFpqrsSubmissions
{
    public function deliver(FpqrsSubmission $submission): void;
}
