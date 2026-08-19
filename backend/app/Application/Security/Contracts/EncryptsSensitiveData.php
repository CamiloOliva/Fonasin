<?php

namespace App\Application\Security\Contracts;

interface EncryptsSensitiveData
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function encryptArray(array $data): string;

    /**
     * @return array<string, mixed>
     */
    public function decryptArray(string $payload): array;
}
