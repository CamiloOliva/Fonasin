<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\HashesSensitiveData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SensitiveHashingTest extends TestCase
{
    use RefreshDatabase;

    public function test_sensitive_lookup_hashes_use_hmac_with_configured_pepper(): void
    {
        config(['security.hashing.pepper' => 'synthetic-pepper']);

        $hasher = app(HashesSensitiveData::class);

        $documentHash = $hasher->documentNumber(' 1234567890 ');
        $emailHash = $hasher->email(' Person@Example.TEST ');

        $this->assertSame(hash_hmac('sha256', '1234567890', 'synthetic-pepper'), $documentHash);
        $this->assertSame(hash_hmac('sha256', 'person@example.test', 'synthetic-pepper'), $emailHash);
        $this->assertNotSame(hash('sha256', '1234567890'), $documentHash);
        $this->assertNotSame(hash('sha256', 'person@example.test'), $emailHash);
    }
}
