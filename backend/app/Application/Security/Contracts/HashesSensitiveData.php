<?php

namespace App\Application\Security\Contracts;

interface HashesSensitiveData
{
    public function documentNumber(string $documentNumber): string;

    public function email(string $email): string;

    public function ip(string $ip): string;

    public function userAgent(string $userAgent): string;
}
