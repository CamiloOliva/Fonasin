<?php

namespace App\Infrastructure\Security;

use App\Application\Security\Contracts\HashesSensitiveData;
use RuntimeException;

class LaravelSensitiveDataHasher implements HashesSensitiveData
{
    public function documentNumber(string $documentNumber): string
    {
        return $this->hmac(strtoupper(trim($documentNumber)));
    }

    public function financialReference(string $reference): string
    {
        return $this->hmac(strtoupper(trim($reference)));
    }

    public function email(string $email): string
    {
        return $this->hmac(strtolower(trim($email)));
    }

    public function ip(string $ip): string
    {
        return $this->hmac(trim($ip));
    }

    public function userAgent(string $userAgent): string
    {
        return $this->hmac(trim($userAgent));
    }

    private function hmac(string $value): string
    {
        $pepper = (string) config('security.hashing.pepper', '');

        if ($pepper === '') {
            throw new RuntimeException('Sensitive hash pepper is not configured.');
        }

        return hash_hmac('sha256', $value, $pepper);
    }
}
