<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Security\Contracts\HashesSensitiveData;
use App\Models\Associate;

class FindAssociateByDocumentNumber
{
    public function __construct(
        private readonly HashesSensitiveData $hasher,
    ) {}

    public function __invoke(string $documentNumber): ?Associate
    {
        return Associate::query()
            ->where('document_number_hash', $this->hasher->documentNumber($documentNumber))
            ->first();
    }
}
