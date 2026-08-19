<?php

namespace App\Infrastructure\Security;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use JsonException;
use RuntimeException;

class LaravelSensitiveDataCipher implements EncryptsSensitiveData
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function encryptArray(array $data): string
    {
        try {
            return Crypt::encryptString(json_encode($data, JSON_THROW_ON_ERROR));
        } catch (JsonException $exception) {
            throw new RuntimeException('Sensitive data could not be encoded before encryption.', previous: $exception);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function decryptArray(string $payload): array
    {
        try {
            $decoded = json_decode(Crypt::decryptString($payload), true, flags: JSON_THROW_ON_ERROR);
        } catch (DecryptException|JsonException $exception) {
            throw new RuntimeException('Sensitive data could not be decrypted.', previous: $exception);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException('Sensitive data payload is not an array.');
        }

        return $decoded;
    }
}
