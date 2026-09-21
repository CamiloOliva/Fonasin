<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsConfigurationTest extends TestCase
{
    public function test_cors_configuration_requires_explicit_credentialed_origins(): void
    {
        $this->assertTrue(config('cors.supports_credentials'));
        $this->assertContains('http://localhost:5173', config('cors.allowed_origins'));
        $this->assertContains('csrf-token', config('cors.paths'));
        $this->assertNotContains('*', config('cors.allowed_origins'));
        $this->assertContains('X-Affiliation-Draft-Token', config('cors.allowed_headers'));
        $this->assertContains('Range', config('cors.allowed_headers'));
        $this->assertContains('Content-Range', config('cors.exposed_headers'));
    }
}
